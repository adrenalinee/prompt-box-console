"use client";

import React from "react";
import { Alert, AppShell, Button, Center, Group, Loader, Select, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import { UserProfileMenu } from "@/components/auth/UserProfileMenu";
import { useSession } from "next-auth/react";
import ServerPhase from "@/components/layout/ServerPhase";
import { LandingPage } from "@/components/landing/LandingPage";

export default function RootPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";

    const { data: workspaces = [], isLoading, isError, error } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () =>
            fetchWorkspaces(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: isAuthenticated,
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

    if (status === "loading") {
        return (
            <Center h="100vh">
                <Loader />
            </Center>
        );
    }

    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Text fw={700}>PromptBox</Text>
                    <Group>
                        <ServerPhase />
                        <UserProfileMenu />
                    </Group>
                </Group>
            </AppShell.Header>
            return (
            <AppShell header={{ height: 60 }} padding="md">
                <AppShell.Header>
                    <Group h="100%" px="md" justify="space-between">
                        <Text fw={700}>PromptBox</Text>
                        <Group>
                            <ServerPhase />
                            <UserProfileMenu />
                        </Group>
                    </Group>
                </AppShell.Header>
                <AppShell.Main>
                    <LandingPage
                        heroAction={
                            !session?.user ? undefined : (
                                <Stack align="center" justify="center">
                                    <Text size="lg">
                                        {session.user.name}! 안녕하세요.
                                    </Text>
                                    <Text fw={700} size="xl">
                                        Workspace 를 선택하세요.
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
                            )
                        }
                    />
                </AppShell.Main>
            </AppShell>
            );
        </AppShell>
    );
}
