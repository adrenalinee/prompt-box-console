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
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePrompt, fetchPromptsPage } from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconDotsVertical } from "@tabler/icons-react";

export default function PromptsPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name?: string } | null>(
        null,
    );

    const nameFilter = searchParams.get("name") ?? "";
    const page = Number(searchParams.get("page") || "1");
    const size = Number(searchParams.get("size") || "20");
    const sort = searchParams.get("sort") || "";

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
        queryKey: [...queryKeys.prompts(workspaceId), nameFilter, page, size, sort],
        queryFn: () =>
            fetchPromptsPage(
                workspaceId,
                page - 1,
                size,
                nameFilter || undefined,
                sort || undefined,
                { suppressNotification: true, suppressAlert: true },
            ),
        enabled: !!workspaceId,
    });

    const deleteMutation = useMutation({
        mutationFn: (promptId: string) => deletePrompt(promptId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId) });
        },
    });

    const items = pageData?.items ?? [];

    return (
        <Stack>
            <Group justify="space-between">
                <Text fw={700} size="xl">
                    Named prompts
                </Text>
                <Button component={Link} href={`/workspaces/${workspaceId}/prompts/new`}>
                    새 Prompt
                </Button>
            </Group>
            <Group grow>
                <TextInput
                    label="Name"
                    placeholder="Prompt 이름"
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
                <Text c="dimmed">등록된 Named prompt가 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            {/*<Table.Th>Default Branch Ref</Table.Th>*/}
                            {/*<Table.Th>Latest Tag Ref</Table.Th>*/}
                            <Table.Th>Description</Table.Th>
                            <Table.Th ta="right">Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((prompt) => (
                            <Table.Tr key={prompt.id}>
                                <Table.Td>{prompt.name}</Table.Td>
                                {/*<Table.Td>{prompt.defaultBranchRefId ?? "-"}</Table.Td>*/}
                                {/*<Table.Td>{prompt.latestTagRefId ?? "-"}</Table.Td>*/}
                                <Table.Td>
                                    <Text
                                        size="sm"
                                        lineClamp={2}
                                    >{prompt.description ?? "-"}</Text>
                                </Table.Td>
                                <Table.Td ta="right">
                                    <Group gap="xs" justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            component={Link}
                                            href={`/workspaces/${workspaceId}/prompts/${prompt.id}`}
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
                                                    color="red"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: prompt.id,
                                                            name: prompt.name,
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

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Prompt 삭제">
                <Stack>
                    <Text>{deleteTarget?.name ?? "Prompt"} 을(를) 삭제하시겠습니까?</Text>
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
