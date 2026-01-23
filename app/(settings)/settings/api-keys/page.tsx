"use client";

import React from "react";
import {
    Button,
    Group,
    Loader,
    Modal,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiKey, fetchApiKeys, fetchVendors } from "@/lib/api/settings";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

function maskKey(value?: string) {
    if (!value) return "••••••";
    if (value.length <= 8) return "••••••";
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export default function SettingsApiKeysPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    React.useEffect(() => {
        if (!workspaceId && workspaces.length > 0) {
            setWorkspaceId(workspaces[0].id);
        }
    }, [workspaceId, workspaces]);

    const { data: apiKeys = [], isLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.apiKeys(workspaceId) : [],
        queryFn: () => fetchApiKeys(workspaceId || ""),
        enabled: !!workspaceId,
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
        }) => createApiKey(workspaceId || "", values),
        onSuccess: () => {
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(workspaceId) });
            }
            setModalOpen(false);
            form.reset();
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
            />

            {isLoading ? (
                <Loader />
            ) : apiKeys.length === 0 ? (
                <Text c="dimmed">등록된 API Key가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Vendor</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {apiKeys.map((apiKey) => (
                            <Table.Tr key={apiKey.id}>
                                <Table.Td>
                                    {vendorMap.get(apiKey.vendorId) ?? apiKey.vendorId}
                                </Table.Td>
                                <Table.Td>{apiKey.name ?? "-"}</Table.Td>
                                <Table.Td>{maskKey()}</Table.Td>
                                <Table.Td>{apiKey.description ?? "-"}</Table.Td>
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
        </Stack>
    );
}
