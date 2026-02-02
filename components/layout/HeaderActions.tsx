"use client";

import React from "react";
import { Group, Button, Tooltip, ActionIcon } from "@mantine/core";
import Link from "next/link";
import { IconPlus, IconSettings } from "@tabler/icons-react";

type HeaderActionsProps = {
    workspaceId: string;
};

export function HeaderActions({ workspaceId }: HeaderActionsProps) {
    return (
        <Group gap="xs">
            {/*<Tooltip label="새 Named prompt">*/}
            {/*    <Button*/}
            {/*        component={Link}*/}
            {/*        href={`/workspaces/${workspaceId}/prompts/new`}*/}
            {/*        leftSection={<IconPlus size={16} />}*/}
            {/*        variant="light"*/}
            {/*    >*/}
            {/*        New Named prompt*/}
            {/*    </Button>*/}
            {/*</Tooltip>*/}
            <Tooltip label="Settings">
                <ActionIcon component={Link} href="/settings" variant="light">
                    <IconSettings size={18} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );
}
