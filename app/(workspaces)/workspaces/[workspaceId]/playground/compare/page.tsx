"use client";

import React from "react";
import { Loader, Stack, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CompareSessionManager } from "@/components/playground/compare/CompareSessionManager";
import { fetchPrompts } from "@/lib/api/prompts";
import { fetchWorkspaceApiKeys, fetchWorkspaceModels, fetchVendors } from "@/lib/api/settings";
import { fetchDefaultOptions, fetchWorkspace } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function ComparePage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;

    // Load Initial State from Session Storage if available
    const [initialState, setInitialState] = React.useState<any>(null);
    React.useEffect(() => {
        try {
            const stored = sessionStorage.getItem("compare_init_state");
            if (stored) {
                setInitialState(JSON.parse(stored));
                // Clear it? Maybe not immediately to allow refresh?
                // sessionStorage.removeItem("compare_init_state");
            }
        } catch (e) {
            console.error("Failed to load initial compare state", e);
        }
    }, []);

    // --- Data Fetching (Reusing logic from PlaygroundPage) ---
    const { data: workspaceData } = useQuery({
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

    const { data: vendors = [], isLoading: vendorsLoading, isError: vendorsError, error: vendorsErrorDetail } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () =>
            fetchVendors(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
    });

    const { data: models = [], isLoading: modelsLoading, isError: modelsError, error: modelsErrorDetail } = useQuery({
        queryKey: workspaceId ? queryKeys.workspaceModels(workspaceId) : [],
        queryFn: () =>
            fetchWorkspaceModels(workspaceId || "", undefined, 0, 50, undefined, undefined, {
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

    if (promptsLoading || modelsLoading || apiKeysLoading || vendorsLoading) {
        return <Loader />;
    }

    if (!workspaceId) {
        return <Text c="dimmed">Workspace를 불러올 수 없습니다.</Text>;
    }

    return (
        <Stack h="100%">
            <CompareSessionManager
                workspaceId={workspaceId}
                prompts={prompts}
                promptsError={promptsError ? promptsErrorDetail : undefined}
                models={models}
                modelsError={modelsError ? modelsErrorDetail : undefined}
                apiKeys={apiKeys}
                apiKeysError={apiKeysError ? apiKeysErrorDetail : undefined}
                vendors={vendors}
                vendorsError={vendorsError ? vendorsErrorDetail : undefined}
                defaultOptions={defaultOptions}
                workspaceDefaultModelId={workspaceData?.defaultModelId}
                initialSessionState={initialState}
            />
        </Stack>
    );
}
