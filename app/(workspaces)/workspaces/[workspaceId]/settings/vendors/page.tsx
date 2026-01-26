"use client";

import React from "react";
import {
    Alert,
    Button,
    Group,
    Loader,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeHighlight } from "@mantine/code-highlight";
import { fetchVendor, fetchVendorsPage } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function WorkspaceVendorsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Vendors
                </Text>
                <Button variant="default" disabled>
                    생성 불가
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
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => updateParam("detail", vendor.id)}
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
        </Stack>
    );
}
