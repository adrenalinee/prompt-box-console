"use client";

import React from "react";
import {Button, Divider, Grid, Group, Loader, Stack, Text} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams, usePathname, useRouter } from "next/navigation";
import { IconArrowsDiff, IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { fetchAdditionalInputs, fetchPrompt, fetchPrompts, fetchRefs } from "@/lib/api/prompts";
import { fetchWorkspaceApiKeys, fetchWorkspaceModels, fetchVendors } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";
import { ExecutePanel, type ExecutePanelRef } from "@/components/playground/ExecutePanel";
import { OutputPanel } from "@/components/playground/OutputPanel";
import { fetchDefaultOptions, fetchWorkspace } from "@/lib/api/workspaces";
import { useWorkspaceHeaderPageActions } from "@/components/layout/WorkspaceHeaderActionsContext";
import { usePlaygroundExecution } from "@/components/playground/usePlaygroundExecution";

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
    const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = React.useState<string>(initialModelId);
    const [selectedApiKeyId, setSelectedApiKeyId] = React.useState<string>(initialApiKeyId);
    const lastPromptIdRef = React.useRef<string>(initialPromptId);
    const executePanelRef = React.useRef<ExecutePanelRef>(null);

    // Sync to URL
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedPromptId) {
            params.set("promptId", selectedPromptId);
        } else {
            params.delete("promptId");
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

        const newQuery = params.toString();
        const currentQuery = searchParams.toString();
        if (newQuery !== currentQuery) {
            router.replace(`${pathname}?${newQuery}`);
        }
    }, [selectedPromptId, selectedRefId, selectedModelId, selectedApiKeyId, pathname, router, searchParams]);

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
                ? queryKeys.additionalInputs(selectedPromptId, Number(selectedRefId))
                : [],
        queryFn: () =>
            fetchAdditionalInputs(selectedPromptId, Number(selectedRefId), 0, 100, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!selectedPromptId && !!selectedRefId,
    });

    const [overrideInstructions, setOverrideInstructions] = React.useState<string | undefined>(undefined);
    const {
        outputBlocks,
        callId,
        outputError,
        isStreaming,
        isCancelled,
        execute,
        stop,
        isStopping,
    } = usePlaygroundExecution({ workspaceId });

    React.useEffect(() => {
        if (initialPromptId && initialRefId) {
            try {
                const key = `playground_override_${initialPromptId}_${initialRefId}`;
                const saved = sessionStorage.getItem(key);
                if (saved) {
                    setOverrideInstructions(saved);
                    // Keep the key in session storage so that if the user navigates Back, the Prompt Detail page can recover the draft.
                    // The Prompt Detail page should handle clearing it when appropriate (e.g. on Save).
                    // sessionStorage.removeItem(key); 
                }
            } catch {
                // ignore
            }
        }
    }, [initialPromptId, initialRefId]);

    const headerActions = React.useMemo(
        () =>
            isStreaming ? (
                <Button
                    leftSection={<IconPlayerStop size={16} />}
                    variant="light"
                    color="red"
                    onClick={stop}
                    loading={isStopping}
                >
                    중단
                </Button>
            ) : (
                <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    type="submit"
                    form="playground-execute-form"
                    variant="filled"
                    loading={refsLoading || modelsLoading || vendorsLoading || apiKeysLoading}
                >
                    실행
                </Button>
            ),
        [
            apiKeysLoading,
            isStopping,
            isStreaming,
            modelsLoading,
            refsLoading,
            stop,
            vendorsLoading,
        ],
    );

    useWorkspaceHeaderPageActions(headerActions);

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
                </Group>
                <Button
                    variant="light"
                    leftSection={<IconArrowsDiff size={16} />}
                    onClick={() => {
                        if (executePanelRef.current) {
                            const values = executePanelRef.current.getValues();
                            const state = {
                                initialPromptId: values.promptId,
                                initialRefId: values.refId,
                                initialModelId: values.modelId,
                                initialApiKeyId: values.apiKeyId,
                                initialOverrideInstructions: values.instructions,
                                initialInputItems: values.inputItems,
                            };
                            sessionStorage.setItem("compare_init_state", JSON.stringify(state));
                            router.push(`/workspaces/${workspaceId}/playground/compare`);
                        }
                    }}
                >
                    비교
                </Button>
            </Group>
            <Divider />
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <ExecutePanel
                        ref={executePanelRef}
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
                        onExecute={(values) => execute(values)}
                        initialOverrideInstructions={
                            // Only apply override if the selected Ref matches the initial Ref for which we loaded the override
                            selectedRefId === initialRefId ? overrideInstructions : undefined
                        }
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <OutputPanel
                        blocks={outputBlocks}
                        callId={callId}
                        workspaceId={workspaceId}
                        errorMessage={outputError}
                        isStreaming={isStreaming}
                        isCancelled={isCancelled}
                    />
                </Grid.Col>
            </Grid>
        </Stack >
    );
}
