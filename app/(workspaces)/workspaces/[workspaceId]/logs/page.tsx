"use client";

import React from "react";
import {
    Alert,
    Button,
    Group,
    Loader,
    NumberFormatter,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    Tooltip
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { fetchLogsPage } from "@/lib/api/llmCalls";
import { fetchWorkspaceModels } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LogsPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const modelId = searchParams.get("modelId") ?? "";
    const status = searchParams.get("status") ?? "";
    const page = Number(searchParams.get("page") || "1");
    const size = Number(searchParams.get("size") || "20");
    const sort = searchParams.get("sort") || "";

    const { data: models = [] } = useQuery({
        queryKey: workspaceId ? queryKeys.workspaceModels(workspaceId) : [],
        queryFn: () =>
            fetchWorkspaceModels(workspaceId || "", undefined, 0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: !!workspaceId,
    });

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
        queryKey: [
            ...queryKeys.logs(workspaceId, { modelId, status }),
            page,
            size,
            sort,
        ],
        queryFn: () =>
            fetchLogsPage(
                workspaceId,
                {
                    modelId: modelId || undefined,
                    status: status || undefined,
                },
                page - 1,
                size,
                sort || undefined,
                { suppressNotification: true, suppressAlert: true },
            ),
        enabled: !!workspaceId,
    });

    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${model.modelKey}`,
    }));

    if (!workspaceId) {
        return <Loader />;
    }

    return (
        <Stack>
            <Text fw={700} size="xl">
                Logs
            </Text>
            <Group grow>
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
                        { value: "RUNNING", label: "RUNNING" },
                        { value: "TIMEOUT", label: "TIMEOUT" },
                        { value: "PENDING", label: "PENDING" },
                        { value: "CANCEL_REQUESTED", label: "CANCEL_REQUESTED" },
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
            ) : isError ? (
                <Alert color="red" title="오류">
                    {error && typeof error === "object" && "message" in error
                        ? String((error as { message?: string }).message)
                        : "요청에 실패했습니다."}
                </Alert>
            ) : (pageData?.items ?? []).length === 0 ? (
                <Text c="dimmed">로그가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Instructions Preview</Table.Th>
                            <Table.Th>Model</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Created</Table.Th>
                            <Table.Th>Elapsed</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {(pageData?.items ?? []).map((log) => (
                            <Table.Tr key={log.id}>
                                <Table.Td>{log.id}</Table.Td>
                                <Table.Td>
                                    <Tooltip label={log.instructionsPreview ?? "-"} withArrow>
                                        <Text lineClamp={2}>
                                            {log.instructionsPreview ?? "-"}
                                        </Text>
                                    </Tooltip>
                                </Table.Td>
                                <Table.Td>{log.llmModelId ?? "-"}</Table.Td>
                                <Table.Td>{log.status ?? "-"}</Table.Td>
                                <Table.Td>{log.createdAt ?? "-"}</Table.Td>
                                <Table.Td>
                                    {/*{log.elapsed ?? "-"}*/}
                                    <NumberFormatter suffix="ms" value={log.elapsed} thousandSeparator />
                                </Table.Td>
                                <Table.Td ta="right">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() =>
                                            router.push(
                                                `/workspaces/${workspaceId}/logs/${log.id}`,
                                            )
                                        }
                                    >
                                        상세
                                    </Button>
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
        </Stack>
    );
}
