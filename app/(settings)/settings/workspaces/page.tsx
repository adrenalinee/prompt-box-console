"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    CopyButton,
    Group,
    Loader,
    Menu,
    Modal,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { IconDotsVertical } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
    updateWorkspace,
} from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function WorkspacesPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{ id: string; name: string; description?: string } | null>(null);
    const [search, setSearch] = React.useState("");
    const [detail, setDetail] = React.useState<unknown | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

    const { data: workspaces = [], isLoading } = useQuery({
        queryKey: [...queryKeys.workspaces, search],
        queryFn: () => fetchWorkspaces(0, 50, search || undefined),
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

    const editForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: { name?: string; description?: string }) =>
            updateWorkspace(editing?.id || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
        },
    });

    const filtered = workspaces;

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
            <TextInput
                label="Name"
                placeholder="Workspace 이름"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
            />

            {isLoading ? (
                <Loader />
            ) : filtered.length === 0 ? (
                <Text c="dimmed">등록된 Workspace가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((workspace) => (
                            <Table.Tr key={workspace.id}>
                                <Table.Td>{workspace.name}</Table.Td>
                                <Table.Td>{workspace.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button size="xs" variant="light" onClick={() => setDetail(workspace)}>
                                            상세
                                        </Button>
                                        <Menu shadow="md" position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="light">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item
                                                onClick={() => {
                                                    setEditing({
                                                        id: workspace.id,
                                                        name: workspace.name,
                                                        description: workspace.description,
                                                    });
                                                    editForm.setValues({
                                                        name: workspace.name,
                                                        description: workspace.description ?? "",
                                                    });
                                                }}
                                            >
                                                수정
                                            </Menu.Item>
                                            <Menu.Item
                                                color="red"
                                                onClick={() => {
                                                setDeleteTarget({ id: workspace.id, name: workspace.name });
                                            }}
                                        >
                                            삭제
                                        </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Table.Td>
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

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="Workspace 수정">
                <form
                    onSubmit={editForm.onSubmit((values) => {
                        updateMutation.mutate(values);
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...editForm.getInputProps("name")} />
                        <TextInput label="Description" {...editForm.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateMutation.isPending}>
                                수정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!detail} onClose={() => setDetail(null)} title="Workspace 상세" size="xl">
                <Group justify="flex-end" mb="xs">
                    <CopyButton value={detail ? JSON.stringify(detail, null, 2) : ""}>
                        {({ copied, copy }) => (
                            <Button size="xs" variant="light" onClick={copy}>
                                {copied ? "Copied" : "Copy JSON"}
                            </Button>
                        )}
                    </CopyButton>
                </Group>
                <CodeHighlight
                    code={detail ? JSON.stringify(detail, null, 2) : ""}
                    language="json"
                />
            </Modal>

            <Modal
                opened={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Workspace 삭제"
            >
                <Stack>
                    <Text>{deleteTarget?.name} 을(를) 삭제하시겠습니까?</Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteTarget(null)}>
                            취소
                        </Button>
                        <Button
                            color="red"
                            loading={deleteMutation.isPending}
                            onClick={() => {
                                if (deleteTarget) {
                                    deleteMutation.mutate(deleteTarget.id);
                                }
                                setDeleteTarget(null);
                            }}
                        >
                            삭제
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
