"use client";

import React from "react";
import { Grid, Loader, Stack, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams } from "next/navigation";
import { fetchPrompts, fetchRefs, fetchSnapshots } from "@/lib/api/prompts";
import { fetchApiKeys, fetchModels, fetchVendors } from "@/lib/api/settings";
import { executeCall } from "@/lib/api/llmCalls";
import { queryKeys } from "@/lib/query/keys";
import { ExecutePanel } from "@/components/playground/ExecutePanel";
import { OutputPanel } from "@/components/playground/OutputPanel";

export default function PlaygroundPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const searchParams = useSearchParams();
    const initialPromptId = searchParams.get("promptId") ?? "";
    const initialSnapshotId = searchParams.get("snapshotId") ?? "";

    const { data: prompts = [], isLoading: promptsLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.prompts(workspaceId) : [],
        queryFn: () => fetchPrompts(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const [selectedPromptId, setSelectedPromptId] = React.useState<string>(initialPromptId);

    React.useEffect(() => {
        if (!selectedPromptId && prompts.length > 0) {
            setSelectedPromptId(prompts[0].id);
        }
    }, [prompts, selectedPromptId]);

    const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
        queryKey: selectedPromptId ? queryKeys.snapshots(selectedPromptId) : [],
        queryFn: () => fetchSnapshots(selectedPromptId),
        enabled: !!selectedPromptId,
    });

    const { data: refs = [], isLoading: refsLoading } = useQuery({
        queryKey: selectedPromptId ? queryKeys.refs(selectedPromptId) : [],
        queryFn: () => fetchRefs(selectedPromptId),
        enabled: !!selectedPromptId,
    });

    const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!selectedVendorId && vendors.length > 0) {
            setSelectedVendorId(vendors[0].id);
        }
    }, [vendors, selectedVendorId]);

    const { data: models = [], isLoading: modelsLoading } = useQuery({
        queryKey: selectedVendorId ? queryKeys.models(selectedVendorId) : [],
        queryFn: () => fetchModels(selectedVendorId || ""),
        enabled: !!selectedVendorId,
    });

    const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.apiKeys(workspaceId) : [],
        queryFn: () => fetchApiKeys(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const [outputText, setOutputText] = React.useState<string>("");
    const [callId, setCallId] = React.useState<string>("");

    const executeMutation = useMutation({
        mutationFn: (payload: {
            sourceType: "REF" | "SNAPSHOT" | "RAW";
            refId?: number;
            snapshotId?: string;
            instructions?: string;
            modelId: string;
            apiKeyId: string;
            overrideOptionsJson?: string;
        }) =>
            executeCall({
                workspaceId: workspaceId || "",
                llmModelId: Number(payload.modelId),
                llmApiKeyId: payload.apiKeyId,
                promptSnapshotId:
                    payload.sourceType === "SNAPSHOT" ? payload.snapshotId : undefined,
                promptRefId: payload.sourceType === "REF" ? payload.refId : undefined,
                rawInstructionsText:
                    payload.sourceType === "RAW" ? payload.instructions : undefined,
                overrideOptionsJson: payload.overrideOptionsJson,
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
        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack>
                    <Text fw={700} size="xl">
                        Playground
                    </Text>
                    <ExecutePanel
                        prompts={prompts}
                        refs={refs}
                        snapshots={snapshots}
                        models={models}
                        apiKeys={apiKeys}
                        vendors={vendors}
                        vendorId={selectedVendorId}
                        onVendorChange={setSelectedVendorId}
                        initialPromptId={initialPromptId}
                        initialSnapshotId={initialSnapshotId}
                        onPromptChange={setSelectedPromptId}
                        onExecute={(values) => executeMutation.mutate(values)}
                        isLoading={
                            executeMutation.isPending ||
                            snapshotsLoading ||
                            refsLoading ||
                            modelsLoading ||
                            vendorsLoading ||
                            apiKeysLoading
                        }
                    />
                </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <OutputPanel outputText={outputText} callId={callId} workspaceId={workspaceId} />
            </Grid.Col>
        </Grid>
    );
}
