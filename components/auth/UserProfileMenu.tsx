"use client";

import {Avatar, Group, Menu, Text, UnstyledButton, rem, Tooltip} from "@mantine/core";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

export function UserProfileMenu() {
    const { data: session } = useSession();

    if (!session?.user) {
        return (
            <Tooltip label="로그인 하세요.">
                <UnstyledButton style={{ cursor: "default" }}>
                    <Avatar radius="xl" size="md" color="gray" />
                </UnstyledButton>
            </Tooltip>
        );
    }

    const { name, email, image } = session.user;

    return (
        <Menu shadow="md" width={260} position="bottom-end">
            <Menu.Target>
                <UnstyledButton>
                    <Group gap={8}>
                        <Avatar src={image} alt={name ?? ""} radius="xl" size="md" color="initials">
                            {name?.charAt(0).toUpperCase()}
                        </Avatar>
                        {/* Optionally show name on desktop? */}
                        {/* <Text size="sm" fw={500} visibleFrom="sm">{name}</Text> */}
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                <div style={{ padding: "8px 12px" }}>
                    <Text size="sm" fw={500}>
                        {name}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ wordBreak: "break-all" }}>
                        {email}
                    </Text>
                </div>

                <Menu.Divider />

                <Menu.Item
                    component={Link}
                    href="/settings"
                    leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} />}
                >
                    Settings
                </Menu.Item>

                <Menu.Item
                    color="red"
                    leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} />}
                    onClick={() => signOut({ redirectTo: "/" })}
                >
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
