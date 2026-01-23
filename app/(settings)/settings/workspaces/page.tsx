"use client";

import React from "react";
import {
    Button,
    Group,
    Loader,
    Modal,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWorkspace, fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function WorkspacesPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);

    const { data: workspaces = [], isLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const form = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: { name: string; description?: string }) => createWorkspace(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
            setModalOpen(false);
            form.reset();
        },
    });

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Workspaces
                </Text>
                <Button
                    onClick={() => {
                        form.reset();
                        setModalOpen(true);
                    }}
                >
                    새 Workspace
                </Button>
            </Group>

            {isLoading ? (
                <Loader />
            ) : workspaces.length === 0 ? (
                <Text c="dimmed">등록된 Workspace가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Description</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {workspaces.map((workspace) => (
                            <Table.Tr key={workspace.id}>
                                <Table.Td>{workspace.name}</Table.Td>
                                <Table.Td>{workspace.description ?? "-"}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Workspace 등록">
                <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                    <Stack>
                        <TextInput label="Name" required {...form.getInputProps("name")} />
                        <TextInput label="Description" {...form.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={mutation.isPending}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}
