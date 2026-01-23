"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Menu,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useForm} from "@mantine/form";
import {createModel, deleteModel, fetchModels, fetchVendors, updateModel} from "@/lib/api/settings";
import {queryKeys} from "@/lib/query/keys";
import {CodeHighlight} from "@mantine/code-highlight";
import {IconDotsVertical} from "@tabler/icons-react";

export default function SettingsModelsPage() {
    const [vendorId, setVendorId] = React.useState<string | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id: number;
        name?: string;
        modelKey?: string;
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        description?: string;
        vendorId?: string;
    } | null>(null);
    const [detail, setDetail] = React.useState<unknown | null>(null);
    const [nameFilter, setNameFilter] = React.useState("");
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(
        null,
    );
    const queryClient = useQueryClient();

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    const { data: models = [], isLoading } = useQuery({
        queryKey: [...queryKeys.models(vendorId), nameFilter],
        queryFn: () => fetchModels(vendorId || undefined, 0, 50, nameFilter || undefined),
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
            vendorId: string;
        }) => createModel(values),
        onSuccess: () => {
            if (vendorId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId) });
            }
            setModalOpen(false);
            form.reset();
        },
    });

    const editForm = useForm({
        initialValues: {
            name: "",
            modelKey: "",
            contextWindow: null as number | null,
            inputPrice: null as number | null,
            outputPrice: null as number | null,
            description: "",
            vendorId: "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (values: {
            vendorId?: string;
            name?: string;
            modelKey?: string;
            contextWindow?: number;
            inputPrice?: number;
            outputPrice?: number;
            description?: string;
        }) => updateModel(editing?.id || 0, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId) });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (modelId: number) => deleteModel(modelId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId) });
        },
    });

    const filtered = models.filter((model) =>
        nameFilter ? (model.name ?? "").toLowerCase().includes(nameFilter.toLowerCase()) : true,
    );

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
            <TextInput
                label="Name"
                placeholder="Model 이름"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.currentTarget.value)}
            />
            {isLoading ? (
                <Loader />
            ) : filtered.length === 0 ? (
                <Text c="dimmed">등록된 모델이 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Model Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((model) => (
                            <Table.Tr key={model.id}>
                                <Table.Td>{model.name ?? "-"}</Table.Td>
                                <Table.Td>{model.modelKey}</Table.Td>
                                <Table.Td>{model.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button size="xs" variant="light" onClick={() => setDetail(model)}>
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
                                                        id: model.id,
                                                        name: model.name,
                                                        modelKey: model.modelKey,
                                                        contextWindow: model.contextWindow,
                                                        inputPrice: model.inputPrice,
                                                        outputPrice: model.outputPrice,
                                                        description: model.description,
                                                        vendorId: model.vendorId,
                                                    });
                                                    editForm.setValues({
                                                        name: model.name ?? "",
                                                        modelKey: model.modelKey ?? "",
                                                        contextWindow: model.contextWindow ?? null,
                                                        inputPrice: model.inputPrice ?? null,
                                                        outputPrice: model.outputPrice ?? null,
                                                        description: model.description ?? "",
                                                        vendorId: model.vendorId,
                                                    });
                                                }}
                                            >
                                                수정
                                            </Menu.Item>
                                            <Menu.Item
                                                color="red"
                                                onClick={() => {
                                                setDeleteTarget({ id: model.id, name: model.name });
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

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Model 등록">
                <form
                    onSubmit={form.onSubmit((values) => {
                        if (!vendorId) {
                            return;
                        }
                        mutation.mutate({
                            vendorId,
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

            <Modal opened={!!editing} onClose={() => setEditing(null)} title="Model 수정">
                <form
                    onSubmit={editForm.onSubmit((values) => {
                        updateMutation.mutate({
                            vendorId: values.vendorId || undefined,
                            name: values.name || undefined,
                            modelKey: values.modelKey || undefined,
                            contextWindow: values.contextWindow ?? undefined,
                            inputPrice: values.inputPrice ?? undefined,
                            outputPrice: values.outputPrice ?? undefined,
                            description: values.description || undefined,
                        });
                    })}
                >
                    <Stack>
                        <Select
                            label="Vendor"
                            data={vendorOptions}
                            {...editForm.getInputProps("vendorId")}
                        />
                        <TextInput label="Name" {...editForm.getInputProps("name")} />
                        <TextInput label="Model Key" {...editForm.getInputProps("modelKey")} />
                        <NumberInput
                            label="Context Window"
                            min={0}
                            {...editForm.getInputProps("contextWindow")}
                        />
                        <NumberInput
                            label="Input Price"
                            min={0}
                            {...editForm.getInputProps("inputPrice")}
                        />
                        <NumberInput
                            label="Output Price"
                            min={0}
                            {...editForm.getInputProps("outputPrice")}
                        />
                        <TextInput label="Description" {...editForm.getInputProps("description")} />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateMutation.isPending}>
                                수정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!detail} onClose={() => setDetail(null)} title="Model 상세" size="xl">
                <CodeHighlight
                    code={detail ? JSON.stringify(detail, null, 2) : ""}
                    language="json"
                />
            </Modal>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Model 삭제">
                <Stack>
                    <Text>{deleteTarget?.name ?? "모델"} 을(를) 삭제하시겠습니까?</Text>
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
