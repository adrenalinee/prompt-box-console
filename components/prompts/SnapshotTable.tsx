"use client";

import React from "react";
import Link from "next/link";
import { Button, Table, Text } from "@mantine/core";
import type { Snapshot } from "@/lib/api/prompts";

type SnapshotTableProps = {
    promptId: string;
    snapshots: Snapshot[];
};

export function SnapshotTable({ promptId, snapshots }: SnapshotTableProps) {
    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Version</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {snapshots.map((snapshot) => (
                    <Table.Tr key={snapshot.id}>
                        <Table.Td>
                            <Text fw={600}>{snapshot.version ?? snapshot.id}</Text>
                        </Table.Td>
                        <Table.Td>{snapshot.createdAt ?? "-"}</Table.Td>
                        <Table.Td>
                            <Button
                                component={Link}
                                href={`/playground?promptId=${promptId}&snapshotId=${snapshot.id}`}
                                variant="light"
                                size="xs"
                            >
                                이 버전으로 실행
                            </Button>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
