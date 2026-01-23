"use client";

import React from "react";
import {
    Button,
    Group,
    Loader,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { createModel, fetchModels, fetchVendors } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsModelsPage() {
    const [vendorId, setVendorId] = React.useState<string | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    React.useEffect(() => {
        if (!vendorId && vendors.length > 0) {
            setVendorId(vendors[0].id);
        }
    }, [vendors, vendorId]);

    const { data: models = [], isLoading } = useQuery({
        queryKey: vendorId ? queryKeys.models(vendorId) : [],
        queryFn: () => fetchModels(vendorId || ""),
        enabled: !!vendorId,
    });

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const form = useForm({
        initialValues: {
            name: "",
            modelKey: "",
            contextWindow: null as number | null,
            inputPrice: null as number | null,
            outputPrice: null as number | null,
            description: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: {
            name: string;
            modelKey: string;
            contextWindow?: number;
            inputPrice?: number;
            outputPrice?: number;
            description?: string;
        }) => createModel(vendorId || "", values),
        onSuccess: () => {
            if (vendorId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId) });
            }
            setModalOpen(false);
            form.reset();
        },
    });

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Models
                </Text>
                <Button
                    onClick={() => {
                        form.reset();
                        setModalOpen(true);
                    }}
                    disabled={!vendorId}
                >
                    새 Model
                </Button>
            </Group>
            <Select
                label="Vendor"
                placeholder="Vendor 선택"
                data={vendorOptions}
                value={vendorId}
                onChange={setVendorId}
                clearable
            />
            {isLoading ? (
                <Loader />
            ) : models.length === 0 ? (
                <Text c="dimmed">등록된 모델이 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Model Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {models.map((model) => (
                            <Table.Tr key={model.id}>
                                <Table.Td>{model.name ?? "-"}</Table.Td>
                                <Table.Td>{model.modelKey}</Table.Td>
                                <Table.Td>{model.description ?? "-"}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Model 등록">
                <form
                    onSubmit={form.onSubmit((values) => {
                        if (!vendorId) {
                            return;
                        }
                        mutation.mutate({
                            name: values.name,
                            modelKey: values.modelKey,
                            contextWindow: values.contextWindow ?? undefined,
                            inputPrice: values.inputPrice ?? undefined,
                            outputPrice: values.outputPrice ?? undefined,
                            description: values.description || undefined,
                        });
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...form.getInputProps("name")} />
                        <TextInput label="Model Key" required {...form.getInputProps("modelKey")} />
                        <NumberInput
                            label="Context Window"
                            min={0}
                            {...form.getInputProps("contextWindow")}
                        />
                        <NumberInput
                            label="Input Price"
                            min={0}
                            {...form.getInputProps("inputPrice")}
                        />
                        <NumberInput
                            label="Output Price"
                            min={0}
                            {...form.getInputProps("outputPrice")}
                        />
                        <TextInput label="Description" {...form.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={mutation.isPending} disabled={!vendorId}>
                                등록
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}
