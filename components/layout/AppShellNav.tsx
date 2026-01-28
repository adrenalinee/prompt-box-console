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
    IconBuildingStore,
    IconAdjustments,
} from "@tabler/icons-react";

type AppShellNavProps = {
    workspaceId: string;
};

export function AppShellNav({ workspaceId }: AppShellNavProps) {
    const pathname = usePathname();
    const base = `/workspaces/${workspaceId}`;

    const navItems = [
        { href: `${base}/playground`, label: "Playground", icon: IconPlayerPlay },
        { href: `${base}/prompts`, label: "Named prompts", icon: IconLayoutList },
        { href: `${base}/logs`, label: "Logs", icon: IconReceipt },
    ];

    const settingsItems = [
        { href: `${base}/settings/api-keys`, label: "API Keys", icon: IconKey },
        { href: `${base}/settings/vendors`, label: "Vendors", icon: IconBuildingStore },
        { href: `${base}/settings/models`, label: "Models", icon: IconDatabase },
        { href: `${base}/settings/default-options`, label: "Default Options", icon: IconAdjustments },
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
                    active={pathname.startsWith(item.href)}
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
                        active={pathname.startsWith(item.href)}
                    />
                ))}
            </NavLink>
        </Stack>
    );
}
