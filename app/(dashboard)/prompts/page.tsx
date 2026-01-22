"use client";

import React from "react";
import { Button, Group, Loader, Stack, Text, TextInput } from "@mantine/core";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/workspace/context";
import { fetchPrompts } from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";
import { PromptTable } from "@/components/prompts/PromptTable";

export default function PromptsPage() {
    const { workspaceId, isLoading: workspaceLoading } = useWorkspace();
    const [search, setSearch] = React.useState("");

    const { data, isLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.prompts(workspaceId) : [],
        queryFn: () => fetchPrompts(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const prompts = React.useMemo(() => {
        if (!data) return [];
        if (!search.trim()) return data;
        return data.filter((prompt) =>
            prompt.name.toLowerCase().includes(search.toLowerCase()),
        );
    }, [data, search]);

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Prompts
                </Text>
                <Button component={Link} href="/prompts/new">
                    새 Prompt
                </Button>
            </Group>
            <TextInput
                placeholder="검색"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
            />
            {workspaceLoading || isLoading ? (
                <Loader />
            ) : prompts.length === 0 ? (
                <Text c="dimmed">등록된 Prompt가 없습니다.</Text>
            ) : (
                <PromptTable prompts={prompts} />
            )}
        </Stack>
    );
}
