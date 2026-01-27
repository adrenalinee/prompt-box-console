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
import { fetchDefaultOptions } from "@/lib/api/workspaces";

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
                text: string;
                kind: "message" | "reasoning";
                part?: string;
                firstDeltaAt?: number;
                doneAt?: number;
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

    const ensureIndexForId = React.useCallback((id?: string, index?: number) => {
        const state = outputItemsRef.current;
        if (!id) {
            if (typeof index === "number") {
                if (!state.indexToItem.has(index)) {
                    state.indexToItem.set(index, { text: "", kind: "message" });
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
            state.indexToItem.set(resolvedIndex, { text: "", kind: "message" });
        }
        state.nextIndex = Math.max(state.nextIndex, resolvedIndex + 1);
        return resolvedIndex;
    }, []);

    const rebuildOutputBlocks = React.useCallback(() => {
        const entries = Array.from(outputItemsRef.current.indexToItem.entries()).sort(
            ([a], [b]) => a - b,
        );
        const blocks: OutputBlock[] = entries.map(([index, item]) => ({
            index,
            text: item.text,
            kind: item.kind,
            part: item.part,
            firstDeltaMs:
                item.firstDeltaAt && requestStartedAtRef.current
                    ? item.firstDeltaAt - requestStartedAtRef.current
                    : undefined,
            doneMs:
                item.doneAt && requestStartedAtRef.current
                    ? item.doneAt - requestStartedAtRef.current
                    : undefined,
        }));
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

    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedPromptId) {
            params.set("promptId", selectedPromptId);
        } else {
            params.delete("promptId");
            params.delete("refId");
        }
        if (selectedRefId) {
            params.set("refId", selectedRefId);
        } else {
            params.delete("refId");
        }
        if (selectedModelId) {
            params.set("modelId", selectedModelId);
        } else {
            params.delete("modelId");
        }
        if (selectedApiKeyId) {
            params.set("apiKeyId", selectedApiKeyId);
        } else {
            params.delete("apiKeyId");
        }
        const query = params.toString();
        const currentQuery = searchParams.toString();
        if (query !== currentQuery) {
            router.replace(query ? `${pathname}?${query}` : pathname);
        }
    }, [
        selectedPromptId,
        selectedRefId,
        selectedModelId,
        selectedApiKeyId,
        pathname,
        router,
        searchParams,
    ]);

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
                        if (event.type === "message.added" || event.type === "reasoning.added") {
                            const index = ensureIndexForId(event.id, event.index);
                            if (typeof index === "number") {
                                const current = outputItemsRef.current.indexToItem.get(index);
                                outputItemsRef.current.indexToItem.set(index, {
                                    text: current?.text ?? "",
                                    kind,
                                    part: isReasoning ? event.part : undefined,
                                    firstDeltaAt: current?.firstDeltaAt,
                                    doneAt: current?.doneAt,
                                });
                                rebuildOutputBlocks();
                            }
                            return;
                        }
                        if (event.type === "message.delta" || event.type === "reasoning.delta") {
                            const index = ensureIndexForId(event.id, event.index);
                            if (typeof index === "number" && typeof event.delta === "string") {
                                const current = outputItemsRef.current.indexToItem.get(index);
                                const now = Date.now();
                                outputItemsRef.current.indexToItem.set(index, {
                                    text: `${current?.text ?? ""}${event.delta}`,
                                    kind,
                                    part: isReasoning ? event.part ?? current?.part : undefined,
                                    firstDeltaAt: current?.firstDeltaAt ?? now,
                                    doneAt: current?.doneAt,
                                });
                                rebuildOutputBlocks();
                            }
                            return;
                        }
                        if (event.type === "message.done" || event.type === "reasoning.done") {
                            const index = ensureIndexForId(event.id, event.index);
                            if (typeof index === "number") {
                                const current = outputItemsRef.current.indexToItem.get(index);
                                const nextText = event.outputText ?? current?.text ?? "";
                                const now = Date.now();
                                outputItemsRef.current.indexToItem.set(index, {
                                    text: nextText,
                                    kind,
                                    part: isReasoning ? event.part ?? current?.part : undefined,
                                    firstDeltaAt: current?.firstDeltaAt ?? now,
                                    doneAt: now,
                                });
                                rebuildOutputBlocks();
                            }
                        }
                    },
                    onError: (error) => {
                        setOutputError(resolveErrorMessage(error));
                    },
                    onComplete: async () => {
                        const id = callIdRef.current;
                        if (!id) return;
                        try {
                            const detail = await fetchLog(id);
                            const items = (detail.outputItems ?? [])
                                .slice()
                                .sort((a, b) => a.position - b.position);
                            if (!items.length) return;
                            setOutputBlocks(
                                items.map((item) => ({
                                    index: item.position - 1,
                                    kind: "message",
                                    text: item.outputText,
                                })),
                            );
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
