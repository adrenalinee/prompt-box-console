"use client";

import React from "react";
import {ActionIcon, Button, Group, Loader, Menu, Modal, Select, Stack, Table, Text,} from "@mantine/core";
import {useQuery} from "@tanstack/react-query";
import {fetchAllLogs, fetchLog} from "@/lib/api/llmCalls";
import {fetchModels, fetchVendors} from "@/lib/api/settings";
import {fetchWorkspaces} from "@/lib/api/workspaces";
import {queryKeys} from "@/lib/query/keys";
import {CodeHighlight} from "@mantine/code-highlight";
import {IconDotsVertical} from "@tabler/icons-react";

export default function SettingsLogsPage() {
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
    const [modelId, setModelId] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<string | null>(null);
    const [vendorId, setVendorId] = React.useState<string | null>(null);

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    React.useEffect(() => {
        setModelId(null);
    }, [vendorId]);

    const { data: models = [] } = useQuery({
        queryKey: queryKeys.models(vendorId),
        queryFn: () => fetchModels(vendorId || undefined),
    });

    const filters = React.useMemo(
        () => ({
            modelId,
            status,
        }),
        [modelId, status],
    );

    const { data: logs = [], isLoading } = useQuery({
        queryKey: queryKeys.logsAll({ ...filters, workspaceId }),
        queryFn: () =>
            fetchAllLogs({
                workspaceId: workspaceId || undefined,
                modelId: modelId || undefined,
                status: status || undefined,
            }),
    });

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${model.modelKey}`,
    }));

    return (
        <Stack>
            <Text fw={700} size="xl">
                Logs
            </Text>
            <Group grow>
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
                    placeholder="전체"
                    data={vendorOptions}
                    value={vendorId}
                    onChange={setVendorId}
                    clearable
                />
                <Select
                    label="Model"
                    placeholder="전체"
                    data={modelOptions}
                    value={modelId}
                    onChange={setModelId}
                    clearable
                />
                <Select
                    label="Status"
                    placeholder="전체"
                    data={[
                        { value: "SUCCESS", label: "SUCCESS" },
                        { value: "ERROR", label: "ERROR" },
                        { value: "TIMEOUT", label: "TIMEOUT" },
                        { value: "CANCELLED", label: "CANCELLED" },
                    ]}
                    value={status}
                    onChange={setStatus}
                    clearable
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : logs.length === 0 ? (
                <Text c="dimmed">로그가 없습니다.</Text>
            ) : (
                <TableWrapper logs={logs} />
            )}
        </Stack>
    );
}

type LogRow = {
    id: string;
    workspaceId?: string;
    llmModelId?: number;
    status?: string;
    elapsed?: number;
    errorMessage?: string;
};

function TableWrapper({ logs }: { logs: LogRow[] }) {
    const [detailId, setDetailId] = React.useState<string | null>(null);
    const { data: detail } = useQuery({
        queryKey: detailId ? queryKeys.log(detailId) : [],
        queryFn: () => fetchLog(detailId || ""),
        enabled: !!detailId,
    });

    return (
        <>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Workspace</Table.Th>
                        <Table.Th>Model</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Elapsed</Table.Th>
                        <Table.Th>Error</Table.Th>
                        <Table.Th ta="right">Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {logs.map((log) => (
                        <Table.Tr key={log.id}>
                            <Table.Td>{log.id}</Table.Td>
                            <Table.Td>{log.workspaceId ?? "-"}</Table.Td>
                            <Table.Td>{log.llmModelId ?? "-"}</Table.Td>
                            <Table.Td>{log.status ?? "-"}</Table.Td>
                            <Table.Td>{log.elapsed ?? "-"}</Table.Td>
                            <Table.Td>{log.errorMessage ?? "-"}</Table.Td>
                            <Table.Td ta="right">
                                <Group gap="xs" justify="flex-end">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => setDetailId(log.id)}
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
                                            <Menu.Item disabled>수정</Menu.Item>
                                            <Menu.Item disabled>삭제</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Modal opened={!!detailId} onClose={() => setDetailId(null)} title="Log 상세" size="xl">
                <CodeHighlight
                    code={detail ? JSON.stringify(detail, null, 2) : ""}
                    language="json"
                />
            </Modal>
        </>
    );
}
