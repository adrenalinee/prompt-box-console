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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import {
    createApiKey,
    deleteApiKey,
    fetchApiKey,
    fetchApiKeysPage,
    fetchVendors,
    updateApiKey,
} from "@/lib/api/settings";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsApiKeysPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: string;
        workspaceId?: string;
        vendorId?: string;
        name?: string;
        description?: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );

    const workspaceId = searchParams.get("workspaceId") ?? "";
    const vendorId = searchParams.get("vendorId") ?? "";
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

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    const { data: pageData, isLoading } = useQuery({
        queryKey: [...queryKeys.apiKeys({ workspaceId, vendorId }), nameFilter, page, size, sort],
        queryFn: () =>
            fetchApiKeysPage(
                {
                    workspaceId: workspaceId || undefined,
                    vendorId: vendorId || undefined,
                    name: nameFilter || undefined,
                },
                page - 1,
                size,
                sort || undefined,
            ),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? ["apiKey", detailId] : [],
        queryFn: () => fetchApiKey(detailId),
        enabled: !!detailId,
    });

    const form = useForm({
        initialValues: {
            vendorId: "",
            name: "",
            value: "",
            description: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: {
            vendorId: string;
            name?: string;
            value: string;
            description?: string;
        }) =>
            createApiKey({
                workspaceId,
                ...values,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys({ workspaceId, vendorId }) });
            setModalOpen(false);
            form.reset();
        },
    });

    const editForm = useForm({
        initialValues: {
            workspaceId: "",
            vendorId: "",
            name: "",
            value: "",
            description: "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: {
            workspaceId?: string;
            vendorId?: string;
            name?: string;
            value?: string;
            description?: string;
        }) => updateApiKey(editing?.id || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys({ workspaceId, vendorId }) });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (apiKeyId: string) => deleteApiKey(apiKeyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys({ workspaceId, vendorId }) });
        },
    });

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    API Keys
                </Text>
                <Button
                    onClick={() => {
                        form.reset();
                        setModalOpen(true);
                    }}
                    disabled={!workspaceId}
                >
                    새 API Key
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
                <Select
                    label="Vendor"
                    placeholder="Vendor 선택"
                    data={vendorOptions}
                    value={vendorId || null}
                    onChange={(value) => updateParam("vendorId", value)}
                    clearable
                />
                <TextInput
                    label="Name"
                    placeholder="API Key 이름"
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
                <Text c="dimmed">등록된 API Key가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Workspace</Table.Th>
                            <Table.Th>Vendor</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((apiKey) => (
                            <Table.Tr key={apiKey.id}>
                                <Table.Td>{apiKey.workspaceId ?? "-"}</Table.Td>
                                <Table.Td>
                                    {vendorMap.get(apiKey.vendorId) ?? apiKey.vendorId}
                                </Table.Td>
                                <Table.Td>{apiKey.name ?? "-"}</Table.Td>
                                <Table.Td>{apiKey.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => updateParam("detail", apiKey.id)}
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
                                                            id: apiKey.id,
                                                            workspaceId: apiKey.workspaceId,
                                                            vendorId: apiKey.vendorId,
                                                            name: apiKey.name,
                                                            description: apiKey.description,
                                                        });
                                                        editForm.setValues({
                                                            workspaceId: apiKey.workspaceId ?? "",
                                                            vendorId: apiKey.vendorId,
                                                            name: apiKey.name ?? "",
                                                            value: "",
                                                            description: apiKey.description ?? "",
                                                        });
                                                    }}
                                                >
                                                    수정
                                                </Menu.Item>
                                                <Menu.Item
                                                    color="red"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: apiKey.id,
                                                            name: apiKey.name,
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
                title="API Key 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="API Key 등록">
                <form
                    onSubmit={form.onSubmit((values) => {
                        if (!workspaceId) return;
                        createMutation.mutate(values);
                    })}
                >
                    <Stack>
                        <Select
                            label="Vendor"
                            required
                            data={vendorOptions}
                            {...form.getInputProps("vendorId")}
                        />
                        <TextInput label="Name" {...form.getInputProps("name")} />
                        <TextInput label="API Key" required {...form.getInputProps("value")} />
                        <TextInput label="Description" {...form.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={createMutation.isPending}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="API Key 수정">
                <form
                    onSubmit={editForm.onSubmit((values) => {
                        updateMutation.mutate({
                            workspaceId: values.workspaceId || undefined,
                            vendorId: values.vendorId || undefined,
                            name: values.name || undefined,
                            value: values.value || undefined,
                            description: values.description || undefined,
                        });
                    })}
                >
                    <Stack>
                        <Select
                            label="Workspace"
                            data={workspaceOptions}
                            {...editForm.getInputProps("workspaceId")}
                            clearable
                        />
                        <Select
                            label="Vendor"
                            data={vendorOptions}
                            {...editForm.getInputProps("vendorId")}
                            clearable
                        />
                        <TextInput label="Name" {...editForm.getInputProps("name")} />
                        <TextInput label="API Key (새 값)" {...editForm.getInputProps("value")} />
                        <TextInput label="Description" {...editForm.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateMutation.isPending}>
                                수정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="API Key 삭제">
                <Stack>
                    <Text>{deleteTarget?.name ?? "API Key"} 을(를) 삭제하시겠습니까?</Text>
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
