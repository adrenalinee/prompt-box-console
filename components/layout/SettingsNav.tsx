"use client";

import React from "react";
import Link from "next/link";
import { NavLink, Stack } from "@mantine/core";
import { usePathname } from "next/navigation";
import {
    IconLayoutDashboard,
    IconBuildingStore,
    IconKey,
    IconDatabase,
    IconLayoutList,
    IconReceipt,
} from "@tabler/icons-react";

const settingsItems = [
    { href: "/settings/workspaces", label: "Workspaces", icon: IconLayoutDashboard },
    { href: "/settings/vendors", label: "Vendors", icon: IconBuildingStore },
    { href: "/settings/api-keys", label: "API Keys", icon: IconKey },
    { href: "/settings/models", label: "Models", icon: IconDatabase },
    { href: "/settings/prompts", label: "Named prompts", icon: IconLayoutList },
    { href: "/settings/logs", label: "Logs", icon: IconReceipt },
];

export function SettingsNav() {
    const pathname = usePathname();

    return (
        <Stack gap="xs">
            {settingsItems.map((item) => (
                <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    leftSection={<item.icon size={18} />}
                    active={pathname.startsWith(item.href)}
                />
            ))}
        </Stack>
    );
}
