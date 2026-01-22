"use client";

import React from "react";
import { Group, Button, Tooltip } from "@mantine/core";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

export function HeaderActions() {
    return (
        <Group gap="xs">
            <Tooltip label="새 Prompt">
                <Button
                    component={Link}
                    href="/prompts/new"
                    leftSection={<IconPlus size={16} />}
                    variant="light"
                >
                    New Prompt
                </Button>
            </Tooltip>
        </Group>
    );
}
