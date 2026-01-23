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
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createApiKey,
    deleteApiKey,
    fetchApiKeys,
    fetchVendors,
    updateApiKey,
} from "@/lib/api/settings";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import { CodeHighlight } from "@mantine/code-highlight";
import { IconDotsVertical } from "@tabler/icons-react";

function maskKey(value?: string) {
    if (!value) return "••••••";
    if (value.length <= 8) return "••••••";
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export default function SettingsApiKeysPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
    const [vendorId, setVendorId] = React.useState<string | null>(null);
    const [nameFilter, setNameFilter] = React.useState("");
    const [editing, setEditing] = React.useState<{
        id: string;
        workspaceId?: string;
        vendorId?: string;
        name?: string;
        description?: string;
    } | null>(null);
    const [detail, setDetail] = React.useState<unknown | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const { data: apiKeys = [], isLoading } = useQuery({
        queryKey: [...queryKeys.apiKeys({ workspaceId, vendorId }), nameFilter],
        queryFn: () =>
            fetchApiKeys({
                workspaceId: workspaceId || undefined,
                vendorId: vendorId || undefined,
                name: nameFilter || undefined,
            }),
    });

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
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
                workspaceId: workspaceId || "",
                ...values,
            }),
        onSuccess: () => {
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys({ workspaceId }) });
            }
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

            <Select
                label="Workspace"
                placeholder="Workspace 선택"
                data={workspaceOptions}
                value={workspaceId}
                onChange={setWorkspaceId}
                disabled={workspaceLoading}
                clearable
            />
            <Select
                label="Vendor"
                placeholder="Vendor 선택"
                data={vendorOptions}
                value={vendorId}
                onChange={setVendorId}
                clearable
            />
            <TextInput
                label="Name"
                placeholder="API Key 이름"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.currentTarget.value)}
            />

            {isLoading ? (
                <Loader />
            ) : apiKeys.length === 0 ? (
                <Text c="dimmed">등록된 API Key가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Workspace</Table.Th>
                            <Table.Th>Vendor</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {apiKeys.map((apiKey) => (
                            <Table.Tr key={apiKey.id}>
                                <Table.Td>{apiKey.workspaceId ?? "-"}</Table.Td>
                                <Table.Td>
                                    {vendorMap.get(apiKey.vendorId) ?? apiKey.vendorId}
                                </Table.Td>
                                <Table.Td>{apiKey.name ?? "-"}</Table.Td>
                                <Table.Td>{maskKey()}</Table.Td>
                                <Table.Td>{apiKey.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button size="xs" variant="light" onClick={() => setDetail(apiKey)}>
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
                                                onClick={() => {
                                                    setDeleteTarget({
                                                        id: apiKey.id,
                                                        name: apiKey.name,
                                                    });
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

            <Modal
                opened={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                title="API Key 등록"
            >
                <form onSubmit={form.onSubmit((values) => createMutation.mutate(values))}>
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

            <Modal opened={!!detail} onClose={() => setDetail(null)} title="API Key 상세" size="xl">
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
