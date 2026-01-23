"use client";

import React from "react";
import Link from "next/link";
import { NavLink, Stack } from "@mantine/core";
import { usePathname } from "next/navigation";
import {
    IconLayoutList,
    IconPlayerPlay,
    IconReceipt,
    IconSettings,
    IconKey,
    IconDatabase,
} from "@tabler/icons-react";

type AppShellNavProps = {
    workspaceId: string;
};

export function AppShellNav({ workspaceId }: AppShellNavProps) {
    const pathname = usePathname();
    const base = `/workspaces/${workspaceId}`;

    const navItems = [
        { href: `${base}/prompts`, label: "Prompts", icon: IconLayoutList },
        { href: `${base}/playground`, label: "Playground", icon: IconPlayerPlay },
        { href: `${base}/logs`, label: "Logs", icon: IconReceipt },
    ];

    const settingsItems = [
        { href: `${base}/settings/api-keys`, label: "API Keys", icon: IconKey },
        { href: `${base}/settings/models`, label: "Models", icon: IconDatabase },
    ];

    return (
        <Stack gap="xs">
            {navItems.map((item) => (
                <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    leftSection={<item.icon size={18} />}
                    active={pathname === item.href}
                />
            ))}
            <NavLink label="Settings" leftSection={<IconSettings size={18} />} defaultOpened>
                {settingsItems.map((item) => (
                    <NavLink
                        key={item.href}
                        component={Link}
                        href={item.href}
                        label={item.label}
                        leftSection={<item.icon size={16} />}
                        active={pathname === item.href}
                    />
                ))}
            </NavLink>
        </Stack>
    );
}
