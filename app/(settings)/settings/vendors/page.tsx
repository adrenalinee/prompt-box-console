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
import { createVendor, deleteVendor, fetchVendors, updateVendor } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function VendorsPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{ id: string; name: string; description?: string } | null>(null);
    const [search, setSearch] = React.useState("");
    const [detail, setDetail] = React.useState<unknown | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

    const { data: vendors = [], isLoading } = useQuery({
        queryKey: [...queryKeys.vendors, search],
        queryFn: () => fetchVendors(0, 50, search || undefined),
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

    const filtered = vendors;

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
            <TextInput
                label="Name"
                placeholder="Vendor 이름"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
            />

            {isLoading ? (
                <Loader />
            ) : filtered.length === 0 ? (
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
                        {filtered.map((vendor) => (
                            <Table.Tr key={vendor.id}>
                                <Table.Td>{vendor.name}</Table.Td>
                                <Table.Td>{vendor.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button size="xs" variant="light" onClick={() => setDetail(vendor)}>
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
                                                onClick={() => {
                                                setDeleteTarget({ id: vendor.id, name: vendor.name });
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

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Vendor 등록">
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

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="Vendor 수정">
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

            <Modal opened={!!detail} onClose={() => setDetail(null)} title="Vendor 상세" size="xl">
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
