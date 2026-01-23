"use client";

import React from "react";
import { Loader, Stack, Tabs, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createSnapshot,
    fetchPrompt,
    fetchRefs,
    fetchSnapshots,
    moveRef,
    createRef,
} from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";
import { PromptEditor } from "@/components/prompts/PromptEditor";
import { SnapshotTable } from "@/components/prompts/SnapshotTable";
import { RefTable } from "@/components/prompts/RefTable";

function pickLatestInstructions(instructionsList: { instructions: string; version?: number }[]) {
    if (instructionsList.length === 0) return "";
    const withVersions = instructionsList.filter((item) => typeof item.version === "number");
    if (withVersions.length > 0) {
        return [...withVersions]
            .sort((a, b) => (a.version ?? 0) - (b.version ?? 0))
            .at(-1)?.instructions ?? "";
    }
    return instructionsList[instructionsList.length - 1]?.instructions ?? "";
}

export default function PromptDetailPage() {
    const params = useParams();
    const promptId = params?.promptId as string;
    const workspaceId = params?.workspaceId as string;
    const queryClient = useQueryClient();

    const { data: prompt, isLoading: promptLoading } = useQuery({
        queryKey: queryKeys.prompt(promptId),
        queryFn: () => fetchPrompt(promptId),
        enabled: !!promptId,
    });

    const { data: snapshots = [], isLoading: snapshotLoading } = useQuery({
        queryKey: queryKeys.snapshots(promptId),
        queryFn: () => fetchSnapshots(promptId),
        enabled: !!promptId,
    });

    const { data: refs = [], isLoading: refsLoading } = useQuery({
        queryKey: queryKeys.refs(promptId),
        queryFn: () => fetchRefs(promptId),
        enabled: !!promptId,
    });

    const snapshotMutation = useMutation({
        mutationFn: (instructions: string) =>
            createSnapshot(promptId, { instructions, additionalInputs: [] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.snapshots(promptId) });
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId) });
            }
        },
    });

    const createRefMutation = useMutation({
        mutationFn: (payload: {
            name: string;
            type: "BRANCH" | "TAG";
            promptSnapshotId: string;
        }) => createRef(promptId, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) }),
    });

    const moveRefMutation = useMutation({
        mutationFn: (payload: { refId: number; promptSnapshotId: string }) =>
            moveRef(promptId, payload.refId, { promptSnapshotId: payload.promptSnapshotId }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) }),
    });

    const latestInstructions = pickLatestInstructions(snapshots);

    if (promptLoading) {
        return <Loader />;
    }

    return (
        <Stack>
            <Text fw={700} size="xl">
                {prompt?.name ?? "Prompt"}
            </Text>
            <Tabs defaultValue="editor">
                <Tabs.List>
                    <Tabs.Tab value="editor">Editor</Tabs.Tab>
                    <Tabs.Tab value="snapshots">Snapshots</Tabs.Tab>
                    <Tabs.Tab value="refs">Refs</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="editor" pt="md">
                    {snapshotLoading ? (
                        <Loader />
                    ) : (
                        <PromptEditor
                            initialInstructions={latestInstructions}
                            onSave={(instructions) => snapshotMutation.mutate(instructions)}
                            isSaving={snapshotMutation.isPending}
                        />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="snapshots" pt="md">
                    {snapshotLoading ? (
                        <Loader />
                    ) : snapshots.length === 0 ? (
                        <Text c="dimmed">스냅샷이 없습니다.</Text>
                    ) : (
                        <SnapshotTable
                            promptId={promptId}
                            workspaceId={workspaceId}
                            snapshots={snapshots}
                        />
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="refs" pt="md">
                    {refsLoading ? (
                        <Loader />
                    ) : (
                        <RefTable
                            refs={refs}
                            snapshots={snapshots}
                            onCreate={(payload) => createRefMutation.mutate(payload)}
                            onMove={(payload) => moveRefMutation.mutate(payload)}
                        />
                    )}
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
