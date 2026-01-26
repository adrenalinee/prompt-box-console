"use client";

import React from "react";
import { Button, Grid, Group, Loader, Stack, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams, usePathname, useRouter } from "next/navigation";
import { IconArrowsDiff, IconPlayerPlay } from "@tabler/icons-react";
import { fetchAdditionalInputs, fetchPrompt, fetchPrompts, fetchRefs } from "@/lib/api/prompts";
import { fetchWorkspaceApiKeys, fetchWorkspaceModels, fetchVendors } from "@/lib/api/settings";
import { executeCall } from "@/lib/api/llmCalls";
import { queryKeys } from "@/lib/query/keys";
import { ExecutePanel } from "@/components/playground/ExecutePanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
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

    const { data: prompts = [], isLoading: promptsLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.prompts(workspaceId) : [],
        queryFn: () => fetchPrompts(workspaceId || ""),
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

    const { data: refs = [], isLoading: refsLoading } = useQuery({
        queryKey: selectedPromptId ? queryKeys.refs(selectedPromptId) : [],
        queryFn: () => fetchRefs(selectedPromptId),
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

    const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = React.useState<string>(initialModelId);
    const [selectedApiKeyId, setSelectedApiKeyId] = React.useState<string>(initialApiKeyId);

    const { data: models = [], isLoading: modelsLoading } = useQuery({
        queryKey: workspaceId
            ? queryKeys.workspaceModels(workspaceId, selectedVendorId)
            : [],
        queryFn: () => fetchWorkspaceModels(workspaceId || "", selectedVendorId || undefined),
        enabled: !!workspaceId,
    });

    const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.workspaceApiKeys(workspaceId) : [],
        queryFn: () => fetchWorkspaceApiKeys(workspaceId || ""),
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
            fetchAdditionalInputs(selectedPromptId, Number(selectedRefId), 0, 100),
        enabled: !!selectedPromptId && !!selectedRefId,
    });

    const [outputText, setOutputText] = React.useState<string>("");
    const [callId, setCallId] = React.useState<string>("");

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
        mutationFn: (payload: {
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
        }) =>
            executeCall({
                workspaceId: workspaceId || "",
                llmModelId: Number(payload.modelId),
                llmApiKeyId: payload.apiKeyId,
                promptRefId: payload.refId,
                rawInstructionsText: payload.instructions,
                inputItems: payload.inputItems,
                overrideOptions: payload.overrideOptions,
            }),
        onSuccess: (result) => {
            setOutputText("");
            setCallId(result.llmCallLogId);
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
                        selectedPromptId={selectedPromptId}
                        onPromptChange={setSelectedPromptId}
                        refs={refs}
                        selectedRefId={selectedRefId}
                        onRefChange={setSelectedRefId}
                        models={models}
                        selectedModelId={selectedModelId}
                        onModelChange={setSelectedModelId}
                        apiKeys={apiKeys}
                        selectedApiKeyId={selectedApiKeyId}
                        onApiKeyChange={setSelectedApiKeyId}
                        vendors={vendors}
                        vendorId={selectedVendorId}
                        onVendorChange={setSelectedVendorId}
                        defaultOptions={defaultOptions ?? null}
                        additionalInputs={additionalInputs}
                        onExecute={(values) => executeMutation.mutate(values)}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <OutputPanel outputText={outputText} callId={callId} workspaceId={workspaceId} />
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
