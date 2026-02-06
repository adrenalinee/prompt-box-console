"use client";

import React from "react";
import {
    ActionIcon,
    Alert,
    Button,
    Group,
    Loader,
    Menu,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text, Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import {
    createApiKey,
    deleteApiKey,
    fetchApiKey,
    fetchVendors,
    fetchWorkspaceApiKeysPage,
    updateApiKey,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

function maskKey(value?: string) {
    if (!value) return "••••••";
    if (value.length <= 8) return "••••••";
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export default function ApiKeysPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: string;
        vendorId?: string;
        name?: string;
        description?: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );

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

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () =>
            fetchVendors(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
    });

    const { data: pageData, isLoading, isError, error } = useQuery({
        queryKey: [
            queryKeys.workspaceApiKeys(workspaceId),
            vendorId,
            nameFilter,
            page,
            size,
            sort,
        ],
        queryFn: () =>
            fetchWorkspaceApiKeysPage(
                workspaceId,
                vendorId || undefined,
                nameFilter || undefined,
                page - 1,
                size,
                sort || undefined,
                { suppressNotification: true, suppressAlert: true },
            ),
        enabled: !!workspaceId,
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
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey?.[0]) &&
                    query.queryKey[0][0] === "workspaceApiKeys" &&
                    query.queryKey[0][1] === workspaceId,
            });
            setModalOpen(false);
            form.reset();
        },
    });

    const editForm = useForm({
        initialValues: {
            vendorId: "",
            name: "",
            value: "",
            description: "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: {
            vendorId?: string;
            name?: string;
            value?: string;
            description?: string;
        }) => updateApiKey(editing?.id || "", values),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey?.[0]) &&
                    query.queryKey[0][0] === "workspaceApiKeys" &&
                    query.queryKey[0][1] === workspaceId,
            });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (apiKeyId: string) => deleteApiKey(apiKeyId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey?.[0]) &&
                    query.queryKey[0][0] === "workspaceApiKeys" &&
                    query.queryKey[0][1] === workspaceId,
            });
        },
    });

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
                >
                    새 API Key
                </Button>
            </Group>

            <Group grow>
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
            ) : isError ? (
                <Alert color="red" title="오류">
                    {error && typeof error === "object" && "message" in error
                        ? String((error as { message?: string }).message)
                        : "요청에 실패했습니다."}
                </Alert>
            ) : items.length === 0 ? (
                <Text c="dimmed">등록된 API Key가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Vendor</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((apiKey) => (
                            <Table.Tr key={apiKey.id}>
                                <Table.Td>{vendorMap.get(apiKey.vendorId) ?? apiKey.vendorId}</Table.Td>
                                <Table.Td>{apiKey.name ?? "-"}</Table.Td>
                                <Table.Td>{maskKey()}</Table.Td>
                                <Table.Td>
                                    <Text
                                        size="sm"
                                        lineClamp={2}
                                    >{apiKey.description ?? "-"}</Text>

                                </Table.Td>
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
                                                            vendorId: apiKey.vendorId,
                                                            name: apiKey.name,
                                                            description: apiKey.description,
                                                        });
                                                        editForm.setValues({
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
                <Group>
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
                <Alert>
                    새로운 api key 정보를 등록합니다, api key 값은 암호화되어 저장됩니다.
                </Alert>
                <form
                    onSubmit={form.onSubmit((values) => {
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
                        <Textarea
                            label="Description"
                            autosize
                            {...form.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={createMutation.isPending}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="API Key 수정">
                <Alert>
                    api key 정보를 수정합니다, api key 값은 암호화되어 저장됩니다.
                </Alert>
                <form
                    onSubmit={editForm.onSubmit((values) => {
                        updateMutation.mutate({
                            vendorId: values.vendorId || undefined,
                            name: values.name || undefined,
                            value: values.value || undefined,
                            description: values.description || undefined,
                        });
                    })}
                >
                    <Stack>
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
