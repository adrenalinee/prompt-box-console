"use client";

import React from "react";
import { Group, Loader, Select, Stack, Text, TextInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { fetchPrompts } from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";
import { PromptTable } from "@/components/prompts/PromptTable";

export default function SettingsPromptsPage() {
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState("");

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    React.useEffect(() => {
        if (!workspaceId && workspaces.length > 0) {
            setWorkspaceId(workspaces[0].id);
        }
    }, [workspaceId, workspaces]);

    const { data: prompts = [], isLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.prompts(workspaceId) : [],
        queryFn: () => fetchPrompts(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const filtered = React.useMemo(() => {
        if (!search.trim()) return prompts;
        return prompts.filter((prompt) =>
            prompt.name.toLowerCase().includes(search.toLowerCase()),
        );
    }, [prompts, search]);

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    return (
        <Stack>
            <Text fw={700} size="xl">
                Prompts
            </Text>
            <Group grow>
                <Select
                    label="Workspace"
                    placeholder="Workspace 선택"
                    data={workspaceOptions}
                    value={workspaceId}
                    onChange={setWorkspaceId}
                    disabled={workspaceLoading}
                />
                <TextInput
                    label="검색"
                    placeholder="Prompt 이름"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : !workspaceId ? (
                <Text c="dimmed">Workspace를 선택하세요.</Text>
            ) : filtered.length === 0 ? (
                <Text c="dimmed">등록된 Prompt가 없습니다.</Text>
            ) : (
                <PromptTable prompts={filtered} workspaceId={workspaceId} />
            )}
        </Stack>
    );
}
