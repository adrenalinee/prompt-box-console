"use client";

import React from "react";
import {AppShell, Group, Text, Burger, Box, Select, ActionIcon, Tooltip} from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { AppShellNav } from "@/components/layout/AppShellNav";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const params = useParams();
    const router = useRouter();
    const workspaceId = params?.workspaceId as string;

    const { data: workspaces = [], isLoading, isError } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () =>
            fetchWorkspaces(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
    });

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const currentWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 240,
                breakpoint: "sm",
                collapsed: { mobile: !opened, desktop: !desktopOpened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text fw={700} component={Link} href="/" className="hover:opacity-80">
                            PromptBox
                        </Text>
                        <Select
                            data={workspaceOptions}
                            value={workspaceId}
                            onChange={(value) => {
                                if (value) {
                                    router.push(`/workspaces/${value}/playground`);
                                }
                            }}
                            placeholder={isLoading ? "Workspace 로딩..." : "Workspace 선택"}
                            size="xs"
                            w={200}
                        />
                        <Tooltip label="사이드 메뉴 열고 닫기">
                            <ActionIcon variant="subtle" onClick={toggleDesktop} visibleFrom="sm" size="input-sm" color="gray">
                                <IconMenu2 size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    <HeaderActions workspaceId={workspaceId} />
                </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <AppShellNav workspaceId={workspaceId} />
            </AppShell.Navbar>
            <AppShell.Main>
                <Box>
                    {!isLoading && !isError && !currentWorkspace && (
                        <Text c="dimmed" mb="sm">
                            워크스페이스 목록에 없는 ID입니다. 그래도 페이지는 표시됩니다.
                        </Text>
                    )}
                    {children}
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}
