"use client";

import React from "react";
import { ActionIcon, Alert, AppShell, Button, Group, Loader, Select, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import {getInitServerPhase} from "@/config/app-config";

export default function RootPage() {
    const router = useRouter();
    const { data: workspaces = [], isLoading, isError, error } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () =>
            fetchWorkspaces(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
    });
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!selectedId && workspaces.length > 0) {
            setSelectedId(workspaces[0].id);
        }
    }, [selectedId, workspaces]);

    const options = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Text fw={700}>PromptBox</Text>

                    <Group>
                        <Text c="gray">ServerPhase: {getInitServerPhase()}</Text>
                        <ActionIcon component={Link} href="/settings" variant="light">
                            <IconSettings size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Main>
                <Stack align="center" justify="center" h="80vh">
                    {/*<Text c="gray">ServerPhase: {getInitServerPhase()}</Text>*/}
                    <Text fw={700} size="xl">
                        Workspace 선택
                    </Text>
                    {isLoading ? (
                        <Loader />
                    ) : isError ? (
                        <Alert color="red" title="오류">
                            {error && typeof error === "object" && "message" in error
                                ? String((error as { message?: string }).message)
                                : "요청에 실패했습니다."}
                        </Alert>
                    ) : (
                        <Group>
                            <Select
                                placeholder="Workspace 선택"
                                data={options}
                                value={selectedId}
                                onChange={setSelectedId}
                                w={240}
                            />
                            <Button
                                onClick={() => {
                                    if (selectedId) {
                                        router.push(`/workspaces/${selectedId}/playground`);
                                    }
                                }}
                                disabled={!selectedId}
                            >
                                이동
                            </Button>
                        </Group>
                    )}
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
