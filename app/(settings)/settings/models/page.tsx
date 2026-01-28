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
    NumberInput,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import {
    createModel,
    deleteModel,
    fetchModel,
    fetchModelsPage,
    fetchVendors,
    updateModel,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsModelsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

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
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(
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
        queryKey: [...queryKeys.models(vendorId || null), nameFilter, page, size, sort],
        queryFn: () =>
            fetchModelsPage(
                vendorId || undefined,
                page - 1,
                size,
                nameFilter || undefined,
                sort || undefined,
                { suppressNotification: true, suppressAlert: true },
            ),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? ["model", detailId] : [],
        queryFn: () => fetchModel(Number(detailId)),
        enabled: !!detailId,
    });

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));

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
        }) =>
            createModel({
                vendorId,
                ...values,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId || null) });
            setModalOpen(false);
            form.reset();
        },
    });

    const editForm = useForm({
        initialValues: {
            vendorId: "",
            name: "",
            modelKey: "",
            contextWindow: null as number | null,
            inputPrice: null as number | null,
            outputPrice: null as number | null,
            description: "",
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
            queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId || null) });
            setEditing(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (modelId: number) => deleteModel(modelId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.models(vendorId || null) });
        },
    });

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Models
                </Text>
                <Tooltip
                    label="먼저 Vendor를 검색/선택해야 생성할 수 있습니다."
                    disabled={!!vendorId}
                    withArrow
                >
                    <div>
                        <Button
                            onClick={() => {
                                form.reset();
                                setModalOpen(true);
                            }}
                            disabled={!vendorId}
                        >
                            새 Model
                        </Button>
                    </div>
                </Tooltip>
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
                    placeholder="Model 이름"
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
                <Text c="dimmed">등록된 모델이 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Vendor</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Model Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((model) => (
                            <Table.Tr key={model.id}>
                                <Table.Td>
                                    {vendorMap.get(model.vendorId) ?? model.vendorId ?? "-"}
                                </Table.Td>
                                <Table.Td>{model.name ?? "-"}</Table.Td>
                                <Table.Td>{model.modelKey}</Table.Td>
                                <Table.Td>{model.description ?? "-"}</Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => updateParam("detail", String(model.id))}
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
                                                            vendorId: model.vendorId,
                                                            name: model.name ?? "",
                                                            modelKey: model.modelKey ?? "",
                                                            contextWindow: model.contextWindow ?? null,
                                                            inputPrice: model.inputPrice ?? null,
                                                            outputPrice: model.outputPrice ?? null,
                                                            description: model.description ?? "",
                                                        });
                                                    }}
                                                >
                                                    수정
                                                </Menu.Item>
                                                <Menu.Item
                                                    color="red"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: model.id,
                                                            name: model.name,
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
                title="Model 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Model 등록">
                <form
                    onSubmit={form.onSubmit((values) => {
                        if (!vendorId) return;
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
