"use client";

import React from "react";
import { AppShell, Group, Text, Burger, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { SettingsNav } from "@/components/layout/SettingsNav";

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
                        <Text fw={700}>Settings</Text>
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
