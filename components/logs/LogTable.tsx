"use client";

import React from "react";
import Link from "next/link";
import { Table, Text } from "@mantine/core";
import type { CallLog } from "@/lib/api/llmCalls";

type LogTableProps = {
    logs: CallLog[];
};

export function LogTable({ logs }: LogTableProps) {
    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Elapsed</Table.Th>
                    <Table.Th>Error</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {logs.map((log) => (
                    <Table.Tr key={log.id}>
                        <Table.Td>
                            <Text component={Link} href={`/logs/${log.id}`} fw={600}>
                                {log.id}
                            </Text>
                        </Table.Td>
                        <Table.Td>{log.llmModelId ?? "-"}</Table.Td>
                        <Table.Td>{log.status ?? "-"}</Table.Td>
                        <Table.Td>{log.elapsed ?? "-"}</Table.Td>
                        <Table.Td>{log.errorMessage ?? "-"}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
