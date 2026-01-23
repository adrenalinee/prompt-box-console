"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Menu,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { IconDotsVertical } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import { fetchAllLogsPage, fetchLog } from "@/lib/api/llmCalls";
import { fetchModels, fetchVendors } from "@/lib/api/settings";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsLogsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const workspaceId = searchParams.get("workspaceId") ?? "";
    const vendorId = searchParams.get("vendorId") ?? "";
    const modelId = searchParams.get("modelId") ?? "";
    const status = searchParams.get("status") ?? "";
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

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    const { data: models = [] } = useQuery({
        queryKey: queryKeys.models(vendorId || null),
        queryFn: () => fetchModels(vendorId || undefined),
    });

    const { data: pageData, isLoading } = useQuery({
        queryKey: [
            queryKeys.logsAll({ workspaceId, modelId, status }),
            page,
            size,
            sort,
        ],
        queryFn: () =>
            fetchAllLogsPage(
                {
                    workspaceId: workspaceId || undefined,
                    modelId: modelId || undefined,
                    status: status || undefined,
                },
                page - 1,
                size,
                sort || undefined,
            ),
    });

    const { data: detail } = useQuery({
        queryKey: detailId ? queryKeys.log(detailId) : [],
        queryFn: () => fetchLog(detailId),
        enabled: !!detailId,
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
        label: model.modelKey,
    }));

    const items = pageData?.items ?? [];

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
                    value={workspaceId || null}
                    onChange={(value) => updateParam("workspaceId", value)}
                    disabled={workspaceLoading}
                    clearable
                />
                <Select
                    label="Vendor"
                    placeholder="전체"
                    data={vendorOptions}
                    value={vendorId || null}
                    onChange={(value) => updateParam("vendorId", value)}
                    clearable
                />
                <Select
                    label="Model"
                    placeholder="전체"
                    data={modelOptions}
                    value={modelId || null}
                    onChange={(value) => updateParam("modelId", value)}
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
                    value={status || null}
                    onChange={(value) => updateParam("status", value)}
                    clearable
                />
                <Select
                    label="Sort"
                    data={[
                        { value: "id,desc", label: "ID ↓" },
                        { value: "id,asc", label: "ID ↑" },
                    ]}
                    value={sort || null}
                    onChange={(value) => updateParam("sort", value)}
                    clearable
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : items.length === 0 ? (
                <Text c="dimmed">로그가 없습니다.</Text>
            ) : (
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
                        {items.map((log) => (
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
                                            onClick={() => updateParam("detail", log.id)}
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
                title="Log 상세"
                size="xl"
            >
                <CodeHighlight code={detail ? JSON.stringify(detail, null, 2) : ""} language="json" />
            </Modal>
        </Stack>
    );
}
