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

const navItems = [
    { href: "/prompts", label: "Prompts", icon: IconLayoutList },
    { href: "/playground", label: "Playground", icon: IconPlayerPlay },
    { href: "/logs", label: "Logs", icon: IconReceipt },
];

const settingsItems = [
    { href: "/settings/api-keys", label: "API Keys", icon: IconKey },
    { href: "/settings/models", label: "Models", icon: IconDatabase },
];

export function AppShellNav() {
    const pathname = usePathname();

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
            <NavLink
                label="Settings"
                leftSection={<IconSettings size={18} />}
                defaultOpened
            >
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
