"use client";

import React from "react";
import Link from "next/link";
import { Table, Text } from "@mantine/core";
import type { Prompt } from "@/lib/api/prompts";

type PromptTableProps = {
    prompts: Prompt[];
    workspaceId?: string;
};

export function PromptTable({ prompts, workspaceId }: PromptTableProps) {
    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>이름</Table.Th>
                    <Table.Th>Default Branch Ref</Table.Th>
                    <Table.Th>Latest Tag Ref</Table.Th>
                    <Table.Th>Description</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {prompts.map((prompt) => (
                    <Table.Tr key={prompt.id}>
                        <Table.Td>
                            {workspaceId || prompt.workspaceId ? (
                                <Text
                                    component={Link}
                                    href={`/workspaces/${workspaceId ?? prompt.workspaceId}/prompts/${prompt.id}`}
                                    fw={600}
                                >
                                    {prompt.name}
                                </Text>
                            ) : (
                                <Text fw={600}>{prompt.name}</Text>
                            )}
                        </Table.Td>
                        <Table.Td>{prompt.defaultBranchRefId ?? "-"}</Table.Td>
                        <Table.Td>{prompt.latestTagRefId ?? "-"}</Table.Td>
                        <Table.Td>{prompt.description ?? "-"}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
