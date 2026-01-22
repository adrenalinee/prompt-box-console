"use client";

import React from "react";
import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { PromptRef, Snapshot } from "@/lib/api/prompts";

type RefTableProps = {
    refs: PromptRef[];
    snapshots: Snapshot[];
    onCreate: (payload: {
        name: string;
        type: "BRANCH" | "TAG";
        promptSnapshotId: string;
    }) => void;
    onMove: (payload: { refId: number; promptSnapshotId: string }) => void;
};

export function RefTable({ refs, snapshots, onCreate, onMove }: RefTableProps) {
    const [createOpened, setCreateOpened] = React.useState(false);
    const [moveTarget, setMoveTarget] = React.useState<PromptRef | null>(null);

    const snapshotOptions = snapshots.map((snapshot) => ({
        value: snapshot.id,
        label: snapshot.version ?? snapshot.id,
    }));

    const createForm = useForm({
        initialValues: {
            name: "",
            type: "BRANCH" as "BRANCH" | "TAG",
            promptSnapshotId: snapshotOptions[0]?.value ?? "",
        },
    });

    const moveForm = useForm({
        initialValues: {
            promptSnapshotId: snapshotOptions[0]?.value ?? "",
        },
    });

    return (
        <>
            <Group justify="space-between" mb="sm">
                <Text fw={600}>Refs</Text>
                <Button onClick={() => setCreateOpened(true)} size="xs">
                    새 Ref
                </Button>
            </Group>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>이름</Table.Th>
                        <Table.Th>타입</Table.Th>
                        <Table.Th>Snapshot</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {refs.map((ref) => (
                        <Table.Tr key={`${ref.type}-${ref.name}`}>
                            <Table.Td>{ref.name}</Table.Td>
                            <Table.Td>{ref.type}</Table.Td>
                            <Table.Td>{ref.promptSnapshotId}</Table.Td>
                            <Table.Td>
                                {ref.type === "BRANCH" ? (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => {
                                            setMoveTarget(ref);
                                            moveForm.setValues({
                                                promptSnapshotId: snapshotOptions[0]?.value ?? "",
                                            });
                                        }}
                                    >
                                        Move
                                    </Button>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        TAG는 고정
                                    </Text>
                                )}
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title="Ref 생성">
                <form
                    onSubmit={createForm.onSubmit((values) => {
                        onCreate(values);
                        setCreateOpened(false);
                        createForm.reset();
                    })}
                >
                    <Stack>
                        <TextInput label="이름" {...createForm.getInputProps("name")} />
                        <Select
                            label="타입"
                            data={[
                                { value: "BRANCH", label: "BRANCH" },
                                { value: "TAG", label: "TAG" },
                            ]}
                            {...createForm.getInputProps("type")}
                        />
                        <Select
                            label="Snapshot"
                            data={snapshotOptions}
                            {...createForm.getInputProps("promptSnapshotId")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit">생성</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={!!moveTarget}
                onClose={() => setMoveTarget(null)}
                title="브랜치 이동"
            >
                <form
                    onSubmit={moveForm.onSubmit((values) => {
                        if (moveTarget) {
                            onMove({
                                refId: moveTarget.id,
                                promptSnapshotId: values.promptSnapshotId,
                            });
                        }
                        setMoveTarget(null);
                    })}
                >
                    <Stack>
                        <Text>{moveTarget?.name}</Text>
                        <Select
                            label="Snapshot"
                            data={snapshotOptions}
                            {...moveForm.getInputProps("promptSnapshotId")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit">이동</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}
