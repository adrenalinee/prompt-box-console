"use client";

import React from "react";
import { AppShell, Group, Text, Burger, Box } from "@mantine/core";
import { IconMessage2Code } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { SettingsNav } from "@/components/layout/SettingsNav";
import Link from "next/link";
import { UserProfileMenu } from "@/components/auth/UserProfileMenu";
import ServerPhase from "@/components/layout/ServerPhase";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 240,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-80">
                            <Group gap={6}>
                                <IconMessage2Code size={22} stroke={1.8} />
                                <Text fw={700}>PromptBox</Text>
                            </Group>
                        </Link>
                        <Text fw={600} c="dimmed">
                            Settings
                        </Text>
                    </Group>
                    <Group>
                        <ServerPhase />
                        <UserProfileMenu />
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <SettingsNav />
            </AppShell.Navbar>
            <AppShell.Main>
                <Box>{children}</Box>
            </AppShell.Main>
        </AppShell>
    );
}
