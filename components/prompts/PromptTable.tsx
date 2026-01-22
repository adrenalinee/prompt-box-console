"use client";

import React from "react";
import Link from "next/link";
import { Table, Text } from "@mantine/core";
import type { Prompt } from "@/lib/api/prompts";

type PromptTableProps = {
    prompts: Prompt[];
};

export function PromptTable({ prompts }: PromptTableProps) {
    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                    <Table.Tr>
                        <Table.Th>이름</Table.Th>
                        <Table.Th>Latest Ref ID</Table.Th>
                        <Table.Th>Description</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {prompts.map((prompt) => (
                    <Table.Tr key={prompt.id}>
                        <Table.Td>
                            <Text component={Link} href={`/prompts/${prompt.id}`} fw={600}>
                                {prompt.name}
                            </Text>
                        </Table.Td>
                        <Table.Td>{prompt.latestRefId ?? "-"}</Table.Td>
                        <Table.Td>{prompt.description ?? "-"}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
