"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Menu,
    Modal,
    Select,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchWorkspaces} from "@/lib/api/workspaces";
import {createPrompt, deletePrompt, fetchAllPrompts, updatePrompt} from "@/lib/api/prompts";
import {queryKeys} from "@/lib/query/keys";
import {useForm} from "@mantine/form";
import {CodeHighlight} from "@mantine/code-highlight";
import {IconDotsVertical} from "@tabler/icons-react";

export default function SettingsPromptsPage() {
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState("");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: string;
        name?: string;
        description?: string;
    } | null>(null);
    const [detail, setDetail] = React.useState<unknown | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );
    const queryClient = useQueryClient();

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const { data: prompts = [], isLoading } = useQuery({
        queryKey: [...queryKeys.prompts(workspaceId || "all"), search],
        queryFn: () =>
            fetchAllPrompts({
                workspaceId: workspaceId || undefined,
                name: search || undefined,
            }),
    });

    const filtered = prompts;

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const createForm = useForm({
        initialValues: {
            name: "",
            description: "",
            instructions: "",
        },
    });

    const editForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: { name: string; description?: string; instructions: string }) =>
            createPrompt(workspaceId || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId || "all") });
            setCreateOpen(false);
            createForm.reset();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: { name?: string; description?: string }) =>
            updatePrompt(editing?.id || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId || "all") });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (promptId: string) => deletePrompt(promptId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId || "all") });
        },
    });

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Prompts
                </Text>
                <Button
                    onClick={() => {
                        createForm.reset();
                        setCreateOpen(true);
                    }}
                    disabled={!workspaceId}
                >
                    새 Prompt
                </Button>
            </Group>
            <Group grow>
                <Select
                    label="Workspace"
                    placeholder="Workspace 선택"
                    data={workspaceOptions}
                    value={workspaceId}
                    onChange={setWorkspaceId}
                    disabled={workspaceLoading}
                    clearable
                />
                <TextInput
                    label="검색"
                    placeholder="Prompt 이름"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : filtered.length === 0 ? (
                <Text c="dimmed">등록된 Prompt가 없습니다.</Text>
            ) : (
                <TableWrapper
                    prompts={filtered}
                    onDetail={setDetail}
                    onEdit={(prompt) => {
                        setEditing({
                            id: prompt.id,
                            name: prompt.name,
                            description: prompt.description,
                        });
                        editForm.setValues({
                            name: prompt.name ?? "",
                            description: prompt.description ?? "",
                        });
                    }}
                    onDelete={(promptId) => deleteMutation.mutate(promptId)}
                    onRequestDelete={(prompt) => setDeleteTarget(prompt)}
                />
            )}

            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Prompt 등록">
                <form
                    onSubmit={createForm.onSubmit((values) => {
                        if (!workspaceId) {
                            return;
                        }
                        createMutation.mutate(values);
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...createForm.getInputProps("name")} />
                        <TextInput label="Description" {...createForm.getInputProps("description")} />
                        <Textarea
                            label="Instructions"
                            minRows={6}
                            {...createForm.getInputProps("instructions")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={createMutation.isPending}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="Prompt 수정">
                <form onSubmit={editForm.onSubmit((values) => updateMutation.mutate(values))}>
                    <Stack>
                        <TextInput label="Name" {...editForm.getInputProps("name")} />
                        <TextInput label="Description" {...editForm.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateMutation.isPending}>
                                수정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!detail} onClose={() => setDetail(null)} title="Prompt 상세" size="xl">
                <CodeHighlight
                    code={detail ? JSON.stringify(detail, null, 2) : ""}
                    language="json"
                />
            </Modal>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Prompt 삭제">
                <Stack>
                    <Text>{deleteTarget?.name ?? "Prompt"} 을(를) 삭제하시겠습니까?</Text>
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

type PromptTableWrapperProps = {
    prompts: {
        id: string;
        name: string;
        description?: string;
        latestRefId?: number;
    }[];
    onDetail: (prompt: unknown) => void;
    onEdit: (prompt: { id: string; name?: string; description?: string }) => void;
    onDelete: (promptId: string) => void;
    onRequestDelete: (prompt: { id: string; name?: string }) => void;
};

function TableWrapper({
    prompts,
    onDetail,
    onEdit,
    onDelete,
    onRequestDelete,
}: PromptTableWrapperProps) {
    if (!prompts) return null;
    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Latest Ref ID</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {prompts.map((prompt) => (
                    <Table.Tr key={prompt.id}>
                        <Table.Td>
                            <Text>{prompt.name}</Text>
                        </Table.Td>
                        <Table.Td>{prompt.latestRefId ?? "-"}</Table.Td>
                        <Table.Td>{prompt.description ?? "-"}</Table.Td>
                        <Table.Td ta="right">
                            <Group gap="xs" justify="flex-end">
                                <Button size="xs" variant="light" onClick={() => onDetail(prompt)}>
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
                                            onClick={() => onEdit(prompt)}
                                        >
                                            수정
                                        </Menu.Item>
                                        <Menu.Item
                                            color="red"
                                            onClick={() => {
                                                onRequestDelete({ id: prompt.id, name: prompt.name });
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
    );
}
