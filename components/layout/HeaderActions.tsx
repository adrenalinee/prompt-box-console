"use client";

import React from "react";
import { Group, Button, Tooltip, ActionIcon } from "@mantine/core";
import Link from "next/link";
import { IconPlus, IconSettings } from "@tabler/icons-react";
import { UserProfileMenu } from "@/components/auth/UserProfileMenu";

type HeaderActionsProps = {
    workspaceId: string;
};

export function HeaderActions({ workspaceId }: HeaderActionsProps) {
    return (
        <Group gap="xs">
            <UserProfileMenu />
        </Group>
    );
}
