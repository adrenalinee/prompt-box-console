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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import {
    createVendor,
    deleteVendor,
    fetchVendor,
    fetchVendorsPage,
    updateVendor,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

function VendorsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{ id: string; name: string; description?: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

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

    const { data: pageData, isLoading, isError, error } = useQuery({
        queryKey: [...queryKeys.vendors, nameFilter, page, size, sort],
        queryFn: () =>
            fetchVendorsPage(
                page - 1,
                size,
                nameFilter || undefined,
                sort || undefined,
                { suppressNotification: true, suppressAlert: true },
            ),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? ["vendor", detailId] : [],
        queryFn: () => fetchVendor(detailId),
        enabled: !!detailId,
    });

    const form = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: { name: string; description?: string }) => createVendor(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
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
            updateVendor(editing?.id || "", values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (vendorId: string) => deleteVendor(vendorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
        },
    });

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Vendors
                </Text>
                <Button
                    onClick={() => {
                        form.reset();
                        setModalOpen(true);
                    }}
                >
                    새 Vendor
                </Button>
            </Group>
            <Group grow>
                <TextInput
                    label="Name"
                    placeholder="Vendor 이름"
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
                <Text c="dimmed">등록된 Vendor가 없습니다.</Text>
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
                        {items.map((vendor) => (
                            <Table.Tr key={vendor.id}>
                                <Table.Td>{vendor.name}</Table.Td>
                                <Table.Td>{vendor.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => updateParam("detail", vendor.id)}
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
                                                            id: vendor.id,
                                                            name: vendor.name,
                                                            description: vendor.description,
                                                        });
                                                        editForm.setValues({
                                                            name: vendor.name,
                                                            description: vendor.description ?? "",
                                                        });
                                                    }}
                                                >
                                                    수정
                                                </Menu.Item>
                                                <Menu.Item
                                                    color="red"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: vendor.id,
                                                            name: vendor.name,
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
                title="Vendor 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Vendor 등록">
                <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                    <Stack>
                        <TextInput label="Name" required {...form.getInputProps("name")} />
                        <Textarea
                            label="Description"
                            autosize
                            {...form.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={mutation.isPending}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="Vendor 수정">
                <form onSubmit={editForm.onSubmit((values) => updateMutation.mutate(values))}>
                    <Stack>
                        <TextInput label="Name" required {...editForm.getInputProps("name")} />
                        <Textarea
                            label="Description"
                            autosize
                            {...editForm.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateMutation.isPending}>
                                수정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Vendor 삭제">
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

export default function VendorsPage() {
    return (
        <React.Suspense fallback={<Loader />}>
            <VendorsContent />
        </React.Suspense>
    );
}
