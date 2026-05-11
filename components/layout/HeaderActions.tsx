"use client";

import React from "react";
import {Group} from "@mantine/core";
import {UserProfileMenu} from "@/components/auth/UserProfileMenu";
import ServerPhase from "@/components/layout/ServerPhase";

type HeaderActionsProps = {
    workspaceId: string;
};

export function HeaderActions({}: HeaderActionsProps) {
    return (
        <Group gap="xs">
            <ServerPhase />
            <UserProfileMenu />
        </Group>
    );
}
