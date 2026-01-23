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
import { createVendor, fetchVendors } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function VendorsPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);

    const { data: vendors = [], isLoading } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
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

            {isLoading ? (
                <Loader />
            ) : vendors.length === 0 ? (
                <Text c="dimmed">등록된 Vendor가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Description</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {vendors.map((vendor) => (
                            <Table.Tr key={vendor.id}>
                                <Table.Td>{vendor.name}</Table.Td>
                                <Table.Td>{vendor.description ?? "-"}</Table.Td>
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
        </Stack>
    );
}
