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
    NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import { showNotification } from "@mantine/notifications";
import {
    createWorkspace,
    deleteWorkspace,
    fetchDefaultOptions,
    fetchWorkspace,
    fetchWorkspacesPage,
    upsertDefaultOptions,
    updateWorkspace,
} from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function WorkspacesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: string;
        name: string;
        description?: string;
    } | null>(null);
    const [defaultOptionsTarget, setDefaultOptionsTarget] = React.useState<{
        id: string;
        name: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(
        null,
    );

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

    const { data: pageData, isLoading } = useQuery({
        queryKey: [...queryKeys.workspaces, nameFilter, page, size, sort],
        queryFn: () =>
            fetchWorkspacesPage(page - 1, size, nameFilter || undefined, sort || undefined),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? ["workspace", detailId, "defaultOptions"] : [],
        queryFn: () => fetchWorkspace(detailId, true),
        enabled: !!detailId,
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

    const defaultOptionsForm = useForm({
        initialValues: {
            temperature: "" as number | "",
            topP: "" as number | "",
            maxTokens: "" as number | "",
            textFormat: "",
            effort: "",
            verbosity: "",
            summary: "",
        },
    });

    const defaultOptionsMutation = useMutation({
        mutationFn: (values: {
            temperature?: number;
            topP?: number;
            maxTokens?: number;
            textFormat?: string;
            effort?: string;
            verbosity?: string;
            summary?: string;
        }) => upsertDefaultOptions(defaultOptionsTarget?.id || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
            if (defaultOptionsTarget?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["workspace", defaultOptionsTarget.id, "defaultOptions"],
                });
            }
            setDefaultOptionsTarget(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
        },
    });

    const items = pageData?.items ?? [];
    const resolveWorkspaceId = (workspace: { id?: string; workspaceId?: string }) =>
        workspace.id ?? workspace.workspaceId ?? "";

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
            <Group grow>
                <TextInput
                    label="Name"
                    placeholder="Workspace 이름"
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
                        {items.map((workspace) => (
                            <Table.Tr key={workspace.id}>
                                <Table.Td>{workspace.name}</Table.Td>
                                <Table.Td>{workspace.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => {
                                                const targetId = resolveWorkspaceId(workspace);
                                                if (!targetId) {
                                                    showNotification({
                                                        color: "red",
                                                        title: "이동 실패",
                                                        message: "workspaceId를 찾을 수 없습니다.",
                                                    });
                                                    return;
                                                }
                                                router.push(`/workspaces/${targetId}`);
                                            }}
                                        >
                                            워크스페이스 홈
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => updateParam("detail", resolveWorkspaceId(workspace))}
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
                                                            id: resolveWorkspaceId(workspace),
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
                                                onClick={() => {
                                                    fetchDefaultOptions(resolveWorkspaceId(workspace)).then((data) => {
                                                        setDefaultOptionsTarget({
                                                            id: resolveWorkspaceId(workspace),
                                                            name: workspace.name,
                                                        });
                                                        defaultOptionsForm.setValues({
                                                            temperature: data?.temperature ?? "",
                                                            topP: data?.topP ?? "",
                                                            maxTokens: data?.maxTokens ?? "",
                                                            textFormat: data?.textFormat ?? "",
                                                            effort: data?.effort ?? "",
                                                            verbosity: data?.verbosity ?? "",
                                                            summary: data?.summary ?? "",
                                                        });
                                                    });
                                                }}
                                            >
                                                defaultOptions 수정
                                            </Menu.Item>
                                            <Menu.Item
                                                color="red"
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        id: resolveWorkspaceId(workspace),
                                                        name: workspace.name,
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
                title="Workspace 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>

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
                <form onSubmit={editForm.onSubmit((values) => updateMutation.mutate(values))}>
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

            <Modal
                opened={!!defaultOptionsTarget}
                onClose={() => {
                    setDefaultOptionsTarget(null);
                    defaultOptionsForm.reset();
                }}
                title="defaultOptions 수정"
                size="xl"
            >
                <form
                    onSubmit={defaultOptionsForm.onSubmit((values) => {
                        defaultOptionsMutation.mutate({
                            temperature: values.temperature === "" ? undefined : values.temperature,
                            topP: values.topP === "" ? undefined : values.topP,
                            maxTokens: values.maxTokens === "" ? undefined : values.maxTokens,
                            textFormat: values.textFormat.trim() || undefined,
                            effort: values.effort || undefined,
                            verbosity: values.verbosity || undefined,
                            summary: values.summary || undefined,
                        });
                    })}
                >
                    <Stack>
                        <Group grow>
                            <NumberInput
                                label="temperature"
                                decimalScale={2}
                                {...defaultOptionsForm.getInputProps("temperature")}
                            />
                            <NumberInput
                                label="topP"
                                {...defaultOptionsForm.getInputProps("topP")}
                            />
                            <NumberInput
                                label="maxTokens"
                                {...defaultOptionsForm.getInputProps("maxTokens")}
                            />
                        </Group>
                        <Group grow>
                            <TextInput
                                label="textFormat"
                                {...defaultOptionsForm.getInputProps("textFormat")}
                            />
                            <Select
                                label="effort"
                                data={[
                                    { value: "DEFAULT", label: "DEFAULT" },
                                    { value: "LOW", label: "LOW" },
                                    { value: "MEDIUM", label: "MEDIUM" },
                                    { value: "HIGH", label: "HIGH" },
                                ]}
                                clearable
                                value={defaultOptionsForm.values.effort || null}
                                onChange={(value) =>
                                    defaultOptionsForm.setFieldValue("effort", value ?? "")
                                }
                            />
                            <Select
                                label="verbosity"
                                data={[
                                    { value: "LOW", label: "LOW" },
                                    { value: "MEDIUM", label: "MEDIUM" },
                                    { value: "HIGH", label: "HIGH" },
                                ]}
                                clearable
                                value={defaultOptionsForm.values.verbosity || null}
                                onChange={(value) =>
                                    defaultOptionsForm.setFieldValue("verbosity", value ?? "")
                                }
                            />
                        </Group>
                        <Select
                            label="summary"
                            data={[
                                { value: "AUTO", label: "AUTO" },
                                { value: "CONCISE", label: "CONCISE" },
                                { value: "DETAILED", label: "DETAILED" },
                            ]}
                            clearable
                            value={defaultOptionsForm.values.summary || null}
                            onChange={(value) =>
                                defaultOptionsForm.setFieldValue("summary", value ?? "")
                            }
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={defaultOptionsMutation.isPending}>
                                저장
                            </Button>
                        </Group>
                    </Stack>
                </form>
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
