"use client";

import React from "react";
import { Button, Grid, Group, Loader, Stack, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams, usePathname, useRouter } from "next/navigation";
import { IconArrowsDiff, IconPlayerPlay } from "@tabler/icons-react";
import { fetchAdditionalInputs, fetchPrompt, fetchPrompts, fetchRefs } from "@/lib/api/prompts";
import { fetchWorkspaceApiKeys, fetchWorkspaceModels, fetchVendors } from "@/lib/api/settings";
import { executeCallStream, fetchLog, LlmStreamEvent } from "@/lib/api/llmCalls";
import { queryKeys } from "@/lib/query/keys";
import { ExecutePanel } from "@/components/playground/ExecutePanel";
import { OutputPanel, type OutputBlock } from "@/components/playground/OutputPanel";
import { fetchDefaultOptions, fetchWorkspace } from "@/lib/api/workspaces";

export default function PlaygroundPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const initialPromptId = searchParams.get("promptId") ?? "";
    const initialRefId = searchParams.get("refId") ?? "";
    const initialModelId = searchParams.get("modelId") ?? "";
    const initialApiKeyId = searchParams.get("apiKeyId") ?? "";

    const {
        data: workspaceData,
    } = useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: () => fetchWorkspace(workspaceId),
        enabled: !!workspaceId,
    });

    const { data: prompts = [], isLoading: promptsLoading, isError: promptsError, error: promptsErrorDetail } = useQuery({
        queryKey: workspaceId ? queryKeys.prompts(workspaceId) : [],
        queryFn: () =>
            fetchPrompts(workspaceId || "", 0, 50, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!workspaceId,
    });

    const [selectedPromptId, setSelectedPromptId] = React.useState<string>(initialPromptId);
    const [selectedRefId, setSelectedRefId] = React.useState<string>(initialRefId);
    const lastPromptIdRef = React.useRef<string>(initialPromptId);

    React.useEffect(() => {
        if (lastPromptIdRef.current && lastPromptIdRef.current !== selectedPromptId) {
            setSelectedRefId("");
        }
        lastPromptIdRef.current = selectedPromptId;
    }, [selectedPromptId]);

    const { data: refs = [], isLoading: refsLoading, isError: refsError, error: refsErrorDetail } = useQuery({
        queryKey: selectedPromptId ? queryKeys.refs(selectedPromptId) : [],
        queryFn: () =>
            fetchRefs(selectedPromptId, 0, 50, { suppressNotification: true, suppressAlert: true }),
        enabled: !!selectedPromptId,
    });

    const { data: promptDetail } = useQuery({
        queryKey: selectedPromptId ? ["prompt", selectedPromptId] : [],
        queryFn: () => fetchPrompt(selectedPromptId),
        enabled: !!selectedPromptId,
    });

    React.useEffect(() => {
        if (!selectedPromptId || selectedRefId || refs.length === 0) return;
        const latestTagId = promptDetail?.latestTagRefId;
        const defaultBranchId = promptDetail?.defaultBranchRefId;
        const refIds = new Set(refs.map((ref) => String(ref.id)));
        if (latestTagId && refIds.has(String(latestTagId))) {
            setSelectedRefId(String(latestTagId));
            return;
        }
        if (defaultBranchId && refIds.has(String(defaultBranchId))) {
            setSelectedRefId(String(defaultBranchId));
        }
    }, [selectedPromptId, selectedRefId, refs, promptDetail]);

    const { data: vendors = [], isLoading: vendorsLoading, isError: vendorsError, error: vendorsErrorDetail } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () =>
            fetchVendors(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
    });

    const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = React.useState<string>(initialModelId);
    const [selectedApiKeyId, setSelectedApiKeyId] = React.useState<string>(initialApiKeyId);

    const { data: models = [], isLoading: modelsLoading, isError: modelsError, error: modelsErrorDetail } = useQuery({
        queryKey: workspaceId
            ? queryKeys.workspaceModels(workspaceId, selectedVendorId)
            : [],
        queryFn: () =>
            fetchWorkspaceModels(workspaceId || "", selectedVendorId || undefined, 0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!workspaceId,
    });

    const { data: apiKeys = [], isLoading: apiKeysLoading, isError: apiKeysError, error: apiKeysErrorDetail } = useQuery({
        queryKey: workspaceId ? queryKeys.workspaceApiKeys(workspaceId) : [],
        queryFn: () =>
            fetchWorkspaceApiKeys(workspaceId || "", undefined, 0, 50, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!workspaceId,
    });

    const { data: defaultOptions } = useQuery({
        queryKey: workspaceId ? ["workspace-default-options", workspaceId] : [],
        queryFn: () => fetchDefaultOptions(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const { data: additionalInputs = [] } = useQuery({
        queryKey:
            selectedPromptId && selectedRefId
                ? ["prompt-additional-inputs", selectedPromptId, selectedRefId]
                : [],
        queryFn: () =>
            fetchAdditionalInputs(selectedPromptId, Number(selectedRefId), 0, 100, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!selectedPromptId && !!selectedRefId,
    });

    const [outputBlocks, setOutputBlocks] = React.useState<OutputBlock[]>([]);
    const [callId, setCallId] = React.useState<string>("");
    const [outputError, setOutputError] = React.useState<string>("");
    const callIdRef = React.useRef<string>("");
    const requestStartedAtRef = React.useRef<number>(0);
    const outputItemsRef = React.useRef<{
        idToIndex: Map<string, number>;
        indexToItem: Map<
            number,
            {
                kind: "message" | "reasoning";
                parts: Map<
                    string,
                    {
                        text: string;
                        firstDeltaAt?: number;
                        doneAt?: number;
                    }
                >;
            }
        >;
        nextIndex: number;
    }>({
        idToIndex: new Map(),
        indexToItem: new Map(),
        nextIndex: 0,
    });

    const resetOutputState = React.useCallback(() => {
        outputItemsRef.current = {
            idToIndex: new Map(),
            indexToItem: new Map(),
            nextIndex: 0,
        };
        requestStartedAtRef.current = Date.now();
        setOutputBlocks([]);
        setCallId("");
        callIdRef.current = "";
        setOutputError("");
    }, []);

    const ensureIndexForId = React.useCallback(
        (id?: string, index?: number, kind: "message" | "reasoning" = "message") => {
            const state = outputItemsRef.current;
            if (!id) {
                if (typeof index === "number") {
                    if (!state.indexToItem.has(index)) {
                        state.indexToItem.set(index, { kind, parts: new Map() });
                    }
                }
                return index ?? null;
            }
            if (state.idToIndex.has(id)) {
                return state.idToIndex.get(id) ?? null;
            }
            const resolvedIndex = typeof index === "number" ? index : state.nextIndex;
            state.idToIndex.set(id, resolvedIndex);
            if (!state.indexToItem.has(resolvedIndex)) {
                state.indexToItem.set(resolvedIndex, { kind, parts: new Map() });
            }
            state.nextIndex = Math.max(state.nextIndex, resolvedIndex + 1);
            return resolvedIndex;
        },
        [],
    );

    const rebuildOutputBlocks = React.useCallback(() => {
        const entries = Array.from(outputItemsRef.current.indexToItem.entries()).sort(
            ([a], [b]) => a - b,
        );
        const blocks: OutputBlock[] = entries.map(([index, item]) => {
            const parts = Array.from(item.parts.entries()).map(([partKey, partData]) => ({
                part: partKey,
                text: partData.text,
                firstDeltaMs:
                    partData.firstDeltaAt && requestStartedAtRef.current
                        ? partData.firstDeltaAt - requestStartedAtRef.current
                        : undefined,
                doneMs:
                    partData.doneAt && requestStartedAtRef.current
                        ? partData.doneAt - requestStartedAtRef.current
                        : undefined,
            }));
            // Sort parts if needed? Maybe SUMMARY before TEXT? Or order of insertion?
            // Usually we want Summary then Detail? Or Detail then Summary?
            // Let's sort: SUMMARY first? Or just alphabetical?
            // "TEXT" vs "SUMMARY".
            // Let's put "SUMMARY" first if it exists, then "TEXT".
            parts.sort((a, b) => {
                const priority = { SUMMARY: 1, TEXT: 2 };
                const pA = priority[a.part as keyof typeof priority] || 99;
                const pB = priority[b.part as keyof typeof priority] || 99;
                return pA - pB;
            });

            return {
                index,
                kind: item.kind,
                parts,
            };
        });
        setOutputBlocks(blocks);
    }, []);

    const resolveErrorMessage = React.useCallback((error: unknown) => {
        if (!error) return "요청 중 문제가 발생했습니다.";
        if (typeof error === "string") return error;
        if (typeof error === "object" && "message" in error) {
            const message = (error as { message?: string }).message;
            if (message) return message;
        }
        return "요청 중 문제가 발생했습니다.";
    }, []);

    // ... useEffect ...

    const executeMutation = useMutation({
        mutationFn: async (payload: {
            refId?: number;
            instructions?: string;
            modelId: string;
            apiKeyId: string;
            inputItems: { role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER"; message: string }[];
            overrideOptions?: {
                temperature?: number;
                topP?: number;
                maxTokens?: number;
                textFormat?: string;
                effort?: string;
                verbosity?: string;
                summary?: string;
            };
        }) => {
            resetOutputState();
            return executeCallStream(
                {
                    workspaceId: workspaceId || "",
                    llmModelId: Number(payload.modelId),
                    llmApiKeyId: payload.apiKeyId,
                    promptRefId: payload.refId,
                    rawInstructionsText: payload.instructions,
                    inputItems: payload.inputItems,
                    overrideOptions: payload.overrideOptions,
                },
                {
                    onEvent: (event: LlmStreamEvent) => {
                        if (event.type === "log.created" && event.id) {
                            callIdRef.current = event.id;
                            setCallId(event.id);
                            return;
                        }
                        if (event.callLogId) {
                            callIdRef.current = event.callLogId;
                            setCallId(event.callLogId);
                        }
                        const isReasoning = event.type.startsWith("reasoning.");
                        const kind: "message" | "reasoning" = isReasoning ? "reasoning" : "message";

                        // Default part to "TEXT" unless specified (SUMMARY etc)
                        const partName = event.part || "TEXT";

                        if (event.type === "message.added" || event.type === "reasoning.added") {
                            const index = ensureIndexForId(event.id, event.index, kind);
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    item.kind = kind; // update kind if needed
                                    if (!item.parts.has(partName)) {
                                        item.parts.set(partName, { text: "" });
                                    }
                                }
                                rebuildOutputBlocks();
                            }
                            return;
                        }
                        if (event.type === "message.delta" || event.type === "reasoning.delta") {
                            const index = ensureIndexForId(event.id, event.index, kind);
                            if (typeof index === "number" && typeof event.delta === "string") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    // Ensure kind is updated if it was defaulted to message
                                    if (kind === "reasoning") {
                                        item.kind = "reasoning";
                                    }
                                    const part = item.parts.get(partName) || { text: "" };
                                    const now = Date.now();
                                    part.text += event.delta;
                                    part.firstDeltaAt = part.firstDeltaAt ?? now;
                                    item.parts.set(partName, part);
                                    rebuildOutputBlocks();
                                }
                            }
                            return;
                        }
                        if (event.type === "message.done" || event.type === "reasoning.done") {
                            const index = ensureIndexForId(event.id, event.index, kind);
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    if (kind === "reasoning") {
                                        item.kind = "reasoning";
                                    }
                                    const part = item.parts.get(partName) || { text: "" };
                                    const now = Date.now();
                                    // Only overwrite text if outputText is provided and not empty (or at least handle it carefully)
                                    // If streaming accumulated text, we don't want to wipe it with empty string.
                                    if (event.outputText) {
                                        part.text = event.outputText;
                                    }
                                    part.firstDeltaAt = part.firstDeltaAt ?? now;
                                    part.doneAt = now;
                                    item.parts.set(partName, part);
                                    rebuildOutputBlocks();
                                }
                            }
                        } return;
                    },
                    onError: (error) => {
                        setOutputError(resolveErrorMessage(error));
                    },
                    onComplete: async () => {
                        const id = callIdRef.current;
                        if (!id) return;
                        try {
                            // If we have any items, we skip fetching logs to avoid overwriting rich stream data
                            if (outputItemsRef.current.indexToItem.size > 0) {
                                return;
                            }

                            const detail = await fetchLog(id);

                            const items = (detail.outputItems ?? [])
                                .slice()
                                .sort((a, b) => a.position - b.position);
                            if (!items.length) return;

                            items.forEach((item, itemIndex) => {
                                const index = itemIndex; // Simple mapping for fallback
                                const map = new Map();
                                let kind: "message" | "reasoning" = "message";

                                if (item.parts && item.parts.length > 0) {
                                    item.parts.forEach((p) => {
                                        map.set(p.part, { text: p.text, doneAt: Date.now() });
                                        if (p.part === "SUMMARY") {
                                            kind = "reasoning";
                                        }
                                    });
                                    // If we have parts but no SUMMARY, and maybe multiple text parts?
                                    // Let's assume if it has parts it might be complex. 
                                    // But checking for SUMMARY is a good heuristic for reasoning.
                                    // Also check if any part suggests reasoning? 
                                    // For now relying on SUMMARY part presence for reasoning kind seems consistent with previous logic.
                                } else {
                                    map.set("TEXT", { text: item.outputText, doneAt: Date.now() });
                                }

                                outputItemsRef.current.indexToItem.set(index, {
                                    kind,
                                    parts: map,
                                });
                            });
                            rebuildOutputBlocks();
                        } catch {
                            // global error handlers will surface the issue
                        }
                    },
                },
            );
        },
        onError: (error) => {
            setOutputError(resolveErrorMessage(error));
        },
    });

    if (promptsLoading) {
        return <Loader />;
    }

    if (!workspaceId) {
        return <Text c="dimmed">Workspace를 불러올 수 없습니다.</Text>;
    }

    return (
        <Stack>
            <Group justify="space-between" align="center">
                <Group gap="sm">
                    <Text fw={700} size="xl">
                        Playground
                    </Text>
                    <Button
                        leftSection={<IconPlayerPlay size={16} />}
                        type="submit"
                        form="playground-execute-form"
                        variant="filled"
                        loading={
                            executeMutation.isPending ||
                            refsLoading ||
                            modelsLoading ||
                            vendorsLoading ||
                            apiKeysLoading
                        }
                    >
                        실행
                    </Button>
                </Group>
                <Button variant="default" leftSection={<IconArrowsDiff size={16} />} disabled>
                    비교
                </Button>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <ExecutePanel
                        workspaceId={workspaceId}
                        prompts={prompts}
                        promptsError={promptsError ? promptsErrorDetail : undefined}
                        selectedPromptId={selectedPromptId}
                        onPromptChange={setSelectedPromptId}
                        refs={refs}
                        refsError={refsError ? refsErrorDetail : undefined}
                        selectedRefId={selectedRefId}
                        onRefChange={setSelectedRefId}
                        models={models}
                        modelsError={modelsError ? modelsErrorDetail : undefined}
                        selectedModelId={selectedModelId}
                        onModelChange={setSelectedModelId}
                        apiKeys={apiKeys}
                        apiKeysError={apiKeysError ? apiKeysErrorDetail : undefined}
                        selectedApiKeyId={selectedApiKeyId}
                        onApiKeyChange={setSelectedApiKeyId}
                        vendors={vendors}
                        vendorsError={vendorsError ? vendorsErrorDetail : undefined}
                        vendorId={selectedVendorId ?? undefined}
                        onVendorChange={setSelectedVendorId}
                        defaultOptions={defaultOptions ?? null}
                        additionalInputs={additionalInputs}
                        workspaceDefaultModelId={workspaceData?.defaultModelId}
                        onExecute={(values) => executeMutation.mutate(values)}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <OutputPanel
                        blocks={outputBlocks}
                        callId={callId}
                        workspaceId={workspaceId}
                        errorMessage={outputError}
                        isStreaming={executeMutation.isPending}
                    />
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
