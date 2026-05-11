"use client";

import React from "react";
import { Button, Group, Modal, Select, Stack, Table, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { PromptRef } from "@/lib/api/prompts";

type RefTableProps = {
    refs: PromptRef[];
    onCreate: (payload: {
        name: string;
        type: "BRANCH" | "TAG";
        fromRefId: number;
    }) => void;
    defaultBranchRefId?: number;
};

export function RefTable({ refs, onCreate, defaultBranchRefId }: RefTableProps) {
    const [createOpened, setCreateOpened] = React.useState(false);

    const refOptions = refs.map((ref) => ({
        value: String(ref.id),
        label: `${ref.name} (${ref.type})`,
    }));

    const createForm = useForm({
        initialValues: {
            name: "",
            type: "BRANCH" as "BRANCH" | "TAG",
            fromRefId: refOptions[0]?.value ?? "",
        },
    });

    React.useEffect(() => {
        if (refOptions.length && !refOptions.find((opt) => opt.value === createForm.values.fromRefId)) {
            createForm.setFieldValue("fromRefId", refOptions[0].value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refOptions]);

    return (
        <>
            <Group justify="space-between" mb="sm">
                <Text fw={600}>Refs</Text>
                <Button onClick={() => setCreateOpened(true)} size="xs" disabled={refs.length === 0}>
                    새 Ref
                </Button>
            </Group>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>이름</Table.Th>
                        <Table.Th>타입</Table.Th>
                        <Table.Th>Instructions</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {refs.map((ref) => (
                        <Table.Tr key={ref.id}>
                            <Table.Td>{ref.name}</Table.Td>
                            <Table.Td>
                                {ref.type}
                                {ref.id === defaultBranchRefId && (
                                    <Text size="xs" c="dimmed">
                                        기본 브랜치
                                    </Text>
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm" lineClamp={2}>
                                    {ref.instructions || "-"}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                {ref.type === "TAG" ? (
                                    <Text size="sm" c="dimmed">
                                        TAG는 고정
                                    </Text>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        Editor에서 수정
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
                        onCreate({
                            name: values.name,
                            type: values.type,
                            fromRefId: Number(values.fromRefId),
                        });
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
                            label="기준 Ref"
                            data={refOptions}
                            placeholder="기준 Ref 선택"
                            {...createForm.getInputProps("fromRefId")}
                        />
                        {refs.length === 0 && (
                            <Text size="sm" c="dimmed">
                                기준 Ref가 없어서 새 Ref를 만들 수 없습니다.
                            </Text>
                        )}
                        <Group justify="flex-end">
                            <Button type="submit" disabled={refs.length === 0}>
                                생성
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}
