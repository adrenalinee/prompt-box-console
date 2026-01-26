"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Menu,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import {
    createPrompt,
    deletePrompt,
    fetchAllPromptsPage,
    fetchPrompt,
    updatePrompt,
} from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsPromptsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [createOpen, setCreateOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: string;
        name?: string;
        description?: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );

    const workspaceId = searchParams.get("workspaceId") ?? "";
    const nameFilter = searchParams.get("name") ?? "";
    const page = Number(searchParams.get("page") || "1");
    const size = Number(searchParams.get("size") || "20");
    const sort = searchParams.get("sort") || "";
    const detailId = searchParams.get("detail") || "";

    const updateParam = React.useCallback(
        (key: string, value?: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (!value) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            if (key !== "page") {
                params.set("page", "1");
            }
            router.replace(`${pathname}?${params.toString()}`);
        },
        [searchParams, router, pathname],
    );

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const { data: pageData, isLoading } = useQuery({
        queryKey: [...queryKeys.prompts(workspaceId || "all"), nameFilter, page, size, sort],
        queryFn: () =>
            fetchAllPromptsPage(
                {
                    workspaceId: workspaceId || undefined,
                    name: nameFilter || undefined,
                },
                page - 1,
                size,
                sort || undefined,
            ),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? ["prompt", detailId] : [],
        queryFn: () => fetchPrompt(detailId),
        enabled: !!detailId,
    });

    const form = useForm({
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
            createPrompt(workspaceId, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId || "all") });
            setCreateOpen(false);
            form.reset();
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

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Prompts
                </Text>
                <Button
                    onClick={() => {
                        form.reset();
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
                    value={workspaceId || null}
                    onChange={(value) => updateParam("workspaceId", value)}
                    disabled={workspaceLoading}
                    clearable
                />
                <TextInput
                    label="Name"
                    placeholder="Prompt 이름"
                    value={nameFilter}
                    onChange={(event) => updateParam("name", event.currentTarget.value || null)}
                />
                <Select
                    label="Sort"
                    data={[
                        { value: "name,asc", label: "Name ↑" },
                        { value: "name,desc", label: "Name ↓" },
                        { value: "id,desc", label: "ID ↓" },
                    ]}
                    value={sort || null}
                    onChange={(value) => updateParam("sort", value)}
                    clearable
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : items.length === 0 ? (
                <Text c="dimmed">등록된 Prompt가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Default Branch Ref</Table.Th>
                            <Table.Th>Latest Tag Ref</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((prompt) => (
                            <Table.Tr key={prompt.id}>
                                <Table.Td>{prompt.name}</Table.Td>
                                <Table.Td>{prompt.defaultBranchRefId ?? "-"}</Table.Td>
                                <Table.Td>{prompt.latestTagRefId ?? "-"}</Table.Td>
                                <Table.Td>{prompt.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => updateParam("detail", prompt.id)}
                                        >
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
                                                            id: prompt.id,
                                                            name: prompt.name,
                                                            description: prompt.description,
                                                        });
                                                        editForm.setValues({
                                                            name: prompt.name ?? "",
                                                            description: prompt.description ?? "",
                                                        });
                                                    }}
                                                >
                                                    수정
                                                </Menu.Item>
                                                <Menu.Item
                                                    color="red"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: prompt.id,
                                                            name: prompt.name,
                                                        })
                                                    }
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

            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    Total {pageData?.totalElements ?? 0}
                </Text>
                <Pagination
                    total={pageData?.totalPages ?? 1}
                    value={page}
                    onChange={(value) => updateParam("page", String(value))}
                />
                <Select
                    data={[
                        { value: "10", label: "10 / page" },
                        { value: "20", label: "20 / page" },
                        { value: "50", label: "50 / page" },
                    ]}
                    value={String(size)}
                    onChange={(value) => updateParam("size", value)}
                />
            </Group>

            <Modal
                opened={!!detailId}
                onClose={() => updateParam("detail", null)}
                title="Prompt 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>

            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Prompt 등록">
                <form
                    onSubmit={form.onSubmit((values) => {
                        if (!workspaceId) return;
                        createMutation.mutate(values);
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...form.getInputProps("name")} />
                        <TextInput label="Description" {...form.getInputProps("description")} />
                        <Textarea label="Instructions" minRows={6} {...form.getInputProps("instructions")} />
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
