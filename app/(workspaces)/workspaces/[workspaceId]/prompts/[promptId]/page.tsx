"use client";

import React from "react";
import {
    ActionIcon,
    Alert,
    Button,
    Collapse,
    Divider,
    Group,
    Loader,
    Menu,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Tabs,
    Text,
    Textarea,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import {
    IconArrowsDiff,
    IconChevronDown,
    IconDotsVertical,
    IconExternalLink,
    IconGitBranch,
    IconSearch
} from "@tabler/icons-react";
import {useParams, usePathname, useRouter, useSearchParams} from "next/navigation";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {AdditionalInputItem, PromptRef} from "@/lib/api/prompts";
import {
    addAdditionalInput,
    createRef,
    deleteAdditionalInput,
    deletePrompt,
    deleteRef,
    fetchAdditionalInputs,
    fetchPrompt,
    fetchRefs,
    updateAdditionalInput,
    updatePrompt,
    updateRef,
} from "@/lib/api/prompts";
import {queryKeys} from "@/lib/query/keys";
import {PromptEditor} from "@/components/prompts/PromptEditor";
import {useDisclosure} from "@mantine/hooks";

const roleOptions = [
    { value: "USER", label: "USER" },
    { value: "ASSISTANT", label: "ASSISTANT" },
    { value: "SYSTEM", label: "SYSTEM" },
    { value: "DEVELOPER", label: "DEVELOPER" },
];

type CreateRefState = {
    opened: boolean;
    type: "BRANCH" | "TAG";
};

type DiffRow = {
    left: string;
    right: string;
    status: "same" | "changed" | "added" | "removed";
};

function buildLineDiff(left: string, right: string): DiffRow[] {
    const leftLines = left.split(/\r?\n/);
    const rightLines = right.split(/\r?\n/);
    const max = Math.max(leftLines.length, rightLines.length);
    const rows: DiffRow[] = [];

    for (let index = 0; index < max; index += 1) {
        const leftLine = leftLines[index];
        const rightLine = rightLines[index];
        if (leftLine === rightLine) {
            rows.push({ left: leftLine ?? "", right: rightLine ?? "", status: "same" });
        } else if (leftLine === undefined) {
            rows.push({ left: "", right: rightLine ?? "", status: "added" });
        } else if (rightLine === undefined) {
            rows.push({ left: leftLine ?? "", right: "", status: "removed" });
        } else {
            rows.push({ left: leftLine, right: rightLine, status: "changed" });
        }
    }

    return rows;
}

export default function PromptDetailPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const promptId = params?.promptId as string;
    const workspaceId = params?.workspaceId as string;
    const queryClient = useQueryClient();
    const refIdParam = searchParams.get("refId");
    const refIdFromQuery = refIdParam ? Number(refIdParam) : null;

    const [selectedRefId, setSelectedRefId] = React.useState<number | null>(refIdFromQuery);
    const [refPickerOpen, setRefPickerOpen] = React.useState(false);
    const [createRefState, setCreateRefState] = React.useState<CreateRefState>({
        opened: false,
        type: "BRANCH",
    });
    const [deleteTarget, setDeleteTarget] = React.useState<PromptRef | null>(null);
    const [inputModalOpen, setInputModalOpen] = React.useState(false);
    const [editingInput, setEditingInput] = React.useState<AdditionalInputItem | null>(null);
    const [promptEditOpen, setPromptEditOpen] = React.useState(false);
    const [promptDeleteOpen, setPromptDeleteOpen] = React.useState(false);
    const [refEditOpen, setRefEditOpen] = React.useState(false);
    const [diffOpen, setDiffOpen] = React.useState(false);
    const [diffLeftId, setDiffLeftId] = React.useState<number | null>(null);
    const [diffRightId, setDiffRightId] = React.useState<number | null>(null);
    const [orderedInputs, setOrderedInputs] = React.useState<AdditionalInputItem[]>([]);
    const [currentInstructions, setCurrentInstructions] = React.useState<string>("");
    const [loadedRefId, setLoadedRefId] = React.useState<number | null>(null);

    const [openedPromptDesc, { toggle: togglePromptDesc }] = useDisclosure(false);
    const [openedPromptRefDesc, { toggle: togglePromptRefDesc }] = useDisclosure(false);

    const { data: prompt, isLoading: promptLoading } = useQuery({
        queryKey: queryKeys.prompt(promptId),
        queryFn: () => fetchPrompt(promptId),
        enabled: !!promptId,
    });

    const { data: refs = [], isLoading: refsLoading } = useQuery({
        queryKey: queryKeys.refs(promptId),
        queryFn: () => fetchRefs(promptId),
        enabled: !!promptId,
    });

    const selectedRef = refs.find((ref) => ref.id === selectedRefId) ?? null;
    const selectedIsBranch = selectedRef?.type === "BRANCH";
    const isDefaultBranch = selectedRef?.id === prompt?.defaultBranchRefId;
    const latestTagRefId = prompt?.latestTagRefId ?? null;

    React.useEffect(() => {
        if (!refs.length) {
            if (selectedRefId !== null) {
                setSelectedRefId(null);
            }
            return;
        }
        if (selectedRefId && refs.some((ref) => ref.id === selectedRefId)) {
            return;
        }
        if (refIdFromQuery && refs.some((ref) => ref.id === refIdFromQuery)) {
            setSelectedRefId(refIdFromQuery);
            return;
        }
        const fallbackRef =
            refs.find((ref) => ref.id === prompt?.defaultBranchRefId) ??
            refs.find((ref) => ref.type === "BRANCH") ??
            refs[0];
        setSelectedRefId(fallbackRef?.id ?? null);
    }, [refs, prompt?.defaultBranchRefId, selectedRefId, refIdFromQuery]);

    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedRefId) {
            params.set("refId", String(selectedRefId));
        } else {
            params.delete("refId");
        }
        const next = params.toString();
        const current = searchParams.toString();
        if (next !== current) {
            router.replace(next ? `${pathname}?${next}` : pathname);
        }
    }, [selectedRefId, searchParams, router, pathname]);

    const { data: additionalInputs = [], isLoading: additionalInputsLoading } = useQuery({
        queryKey: queryKeys.additionalInputs(promptId, selectedRefId),
        queryFn: () => fetchAdditionalInputs(promptId, selectedRefId as number),
        enabled: !!promptId && !!selectedRefId,
    });

    React.useEffect(() => {
        const sorted = [...additionalInputs].sort((a, b) => a.position - b.position);
        setOrderedInputs(sorted);
    }, [additionalInputs]);

    const createRefForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const promptForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const refMetaForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
    });

    const inputForm = useForm({
        initialValues: {
            position: null as number | null,
            role: "USER" as AdditionalInputItem["role"],
            message: "",
        },
    });

    React.useEffect(() => {
        if (prompt && !promptEditOpen) {
            promptForm.setValues({
                name: prompt.name ?? "",
                description: prompt.description ?? "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, promptEditOpen]);

    React.useEffect(() => {
        if (selectedRef) {
            if (!refEditOpen) {
                refMetaForm.setValues({
                    name: selectedRef.name ?? "",
                    description: selectedRef.description ?? "",
                });
            }

            // Check if there's a draft in session storage (e.g. returning from Playground)
            let nextInstructions = selectedRef.instructions;
            try {
                const key = `playground_override_${promptId}_${selectedRef.id}`;
                const draft = sessionStorage.getItem(key);
                if (draft !== null) {
                    nextInstructions = draft;
                }
            } catch {
                // ignore
            }
            setCurrentInstructions(nextInstructions);
            setLoadedRefId(selectedRef.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRef?.id, selectedRef?.instructions, refEditOpen]);

    React.useEffect(() => {
        if (diffOpen && refs.length) {
            if (!diffLeftId) {
                setDiffLeftId(selectedRef?.id ?? refs[0]?.id ?? null);
            }
            if (!diffRightId) {
                setDiffRightId(selectedRef?.id ?? refs[0]?.id ?? null);
            }
        }
    }, [diffOpen, refs, diffLeftId, diffRightId, selectedRef]);

    const updateRefMutation = useMutation({
        mutationFn: (payload: { refId: number; instructions: string }) =>
            updateRef(promptId, payload.refId, { instructions: payload.instructions }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) });
            // Clear the draft from session storage on save
            try {
                const key = `playground_override_${promptId}_${variables.refId}`;
                sessionStorage.removeItem(key);
            } catch {
                // ignore
            }
        },
    });

    const updateRefMetaMutation = useMutation({
        mutationFn: (payload: { refId: number; name: string; description?: string }) =>
            updateRef(promptId, payload.refId, {
                name: payload.name,
                description: payload.description || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) });
            setRefEditOpen(false);
        },
    });

    const createRefMutation = useMutation({
        mutationFn: (payload: { name: string; description?: string; type: "BRANCH" | "TAG" }) =>
            createRef(promptId, {
                name: payload.name,
                type: payload.type,
                fromRefId: selectedRefId as number,
                description: payload.description || undefined,
            }),
        onSuccess: (ref) => {
            queryClient.setQueryData(queryKeys.refs(promptId), (old: PromptRef[] | undefined) => {
                const list = old ? [...old] : [];
                if (!list.find((r) => r.id === ref.id)) {
                    list.push(ref);
                }
                return list;
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) });
            setCreateRefState((prev) => ({ ...prev, opened: false }));
            createRefForm.reset();
            setSelectedRefId(ref.id);
        },
    });

    const deleteRefMutation = useMutation({
        mutationFn: (refId: number) => deleteRef(promptId, refId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.refs(promptId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.prompt(promptId) });
            setSelectedRefId(null);
            setDeleteTarget(null);
        },
    });

    const updatePromptMutation = useMutation({
        mutationFn: (payload: { name: string; description?: string }) =>
            updatePrompt(promptId, {
                name: payload.name,
                description: payload.description || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.prompt(promptId) });
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId) });
            }
            setPromptEditOpen(false);
        },
    });

    const deletePromptMutation = useMutation({
        mutationFn: () => deletePrompt(promptId),
        onSuccess: () => {
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId) });
            }
            router.push(`/workspaces/${workspaceId}/prompts`);
        },
    });

    const addInputMutation = useMutation({
        mutationFn: (payload: { position?: number; role: AdditionalInputItem["role"]; message: string }) =>
            addAdditionalInput(promptId, selectedRefId as number, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.additionalInputs(promptId, selectedRefId),
            });
            setInputModalOpen(false);
            inputForm.reset();
        },
    });

    const updateInputMutation = useMutation({
        mutationFn: (payload: {
            id: number;
            position?: number;
            role: AdditionalInputItem["role"];
            message: string;
        }) =>
            updateAdditionalInput(
                promptId,
                selectedRefId as number,
                payload.id,
                {
                    position: payload.position,
                    role: payload.role,
                    message: payload.message,
                },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.additionalInputs(promptId, selectedRefId),
            });
            setInputModalOpen(false);
            setEditingInput(null);
            inputForm.reset();
        },
    });

    const deleteInputMutation = useMutation({
        mutationFn: (payload: { id: number }) =>
            deleteAdditionalInput(promptId, selectedRefId as number, payload.id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.additionalInputs(promptId, selectedRefId),
            });
        },
    });


    if (promptLoading) {
        return <Loader />;
    }

    if (!promptId) {
        return <Text c="dimmed">Prompt를 불러올 수 없습니다.</Text>;
    }

    const branchRefs = refs.filter((ref) => ref.type === "BRANCH");
    const tagRefs = refs.filter((ref) => ref.type === "TAG");
    const diffLeftRef = refs.find((ref) => ref.id === diffLeftId) ?? null;
    const diffRightRef = refs.find((ref) => ref.id === diffRightId) ?? null;
    const diffRows = buildLineDiff(diffLeftRef?.instructions ?? "", diffRightRef?.instructions ?? "");

    return (
        <Stack>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap="xs">
                    <Group gap="xs" align="center">
                        <Text fw={700} size="xl">
                            {prompt?.name ?? "Prompt"}
                        </Text>
                        <ActionIcon onClick={togglePromptDesc} c="dimmed" size="xs" variant="white">
                            <IconChevronDown />
                        </ActionIcon>
                    </Group>

                    <Collapse in={openedPromptDesc}>
                        <Stack gap="xs">
                            <Group gap="xs">
                                <Text size="xs">id: {prompt?.id}</Text>
                                <Button
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconSearch size={14} />}
                                    rightSection={<IconExternalLink size={14} />}
                                    component="a"
                                    href={`/workspaces/${workspaceId}/logs?promptId=${prompt?.id}`}
                                >로그 검색</Button>
                            </Group>
                            <Text c="dimmed" size="sm">
                                {prompt?.description ?? ""}
                            </Text>
                        </Stack>
                    </Collapse>
                </Stack>
                <Menu position="bottom-end" shadow="md" width={180}>
                    <Menu.Target>
                        <Tooltip label="Named prompt 추가 메뉴">
                            <ActionIcon variant="subtle" aria-label="prompt menu">
                                <IconDotsVertical size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Menu.Target>
                    <Menu.Dropdown>
                        {/*<Menu.Label>Named prompt</Menu.Label>*/}
                        <Menu.Item onClick={() => setPromptEditOpen(true)}>수정</Menu.Item>
                        <Menu.Item color="red" onClick={() => setPromptDeleteOpen(true)}>
                            삭제
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Divider />

            <Stack gap="xs">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Button
                            variant="default"
                            leftSection={<IconGitBranch size={16} />}
                            onClick={() => setRefPickerOpen(true)}
                        >
                            {selectedRef ? `${selectedRef.name} (${selectedRef.type})` : "Ref 선택"}
                        </Button>
                        {isDefaultBranch && (
                            <Text size="sm" c="dimmed">
                                기본 브랜치
                            </Text>
                        )}
                        {latestTagRefId && selectedRef?.id === latestTagRefId && (
                            <Text size="sm" c="dimmed">
                                최신 태그
                            </Text>
                        )}
                        <ActionIcon onClick={togglePromptRefDesc} c="dimmed" size="xs" variant="white">
                            <IconChevronDown />
                        </ActionIcon>
                    </Group>
                    <Group>
                        <Tooltip label="현재 수정된 내용으로 새로운 branch 를 생성합니다." withArrow>
                            <div>
                                <Button
                                    variant="default"
                                    onClick={() =>
                                        setCreateRefState({ opened: true, type: "BRANCH" })
                                    }
                                    disabled={!selectedRef}
                                >
                                    새 Branch
                                </Button>
                            </div>
                        </Tooltip>
                        <Tooltip label="현재 branch 의 내용을 태그로 고정합니다." withArrow>
                            <div>
                                <Button
                                    variant="default"
                                    onClick={() => setCreateRefState({ opened: true, type: "TAG" })}
                                    disabled={!selectedRef || selectedRef?.type === "TAG"}
                                >
                                    Tag
                                </Button>
                            </div>
                        </Tooltip>
                        <Tooltip label="지금 입력된 값으로 Playground 에서 테스트합니다." withArrow>
                            <div>
                                <Button
                                    onClick={() => {
                                        if (selectedRef) {
                                            try {
                                                const key = `playground_override_${promptId}_${selectedRef.id}`;
                                                sessionStorage.setItem(key, currentInstructions);
                                            } catch {
                                                // ignore
                                            }
                                            router.push(
                                                `/workspaces/${workspaceId}/playground?promptId=${promptId}&refId=${selectedRef.id}`,
                                            );
                                        }
                                    }}
                                    disabled={!selectedRef}
                                >
                                    Playground
                                </Button>
                            </div>
                        </Tooltip>
                        <Menu position="bottom-end" shadow="md" width={200}>
                            <Menu.Target>
                                <Tooltip label="Named prompt BRANCH/TAG 추가 메뉴">
                                    <ActionIcon variant="subtle" aria-label="ref menu">
                                        <IconDotsVertical size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {/*<Menu.Label>Named prompt reference</Menu.Label>*/}
                                {isDefaultBranch && (
                                    <Menu.Label>기본 브랜치는 삭제할 수 없습니다.</Menu.Label>
                                )}
                                {selectedRef && !selectedIsBranch && (
                                    <Menu.Label>태그는 수정/삭제 할 수 없습니다.</Menu.Label>
                                )}
                                <Menu.Item
                                    onClick={() => setRefEditOpen(true)}
                                    disabled={!selectedRef || !selectedIsBranch}
                                >
                                    수정
                                </Menu.Item>
                                <Menu.Item
                                    color="red"
                                    onClick={() => selectedRef && setDeleteTarget(selectedRef)}
                                    disabled={!selectedRef || !selectedIsBranch || isDefaultBranch}
                                >
                                    삭제
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
                <Collapse in={openedPromptRefDesc}>
                    <Stack gap="xs">
                        <Text size="xs">id: {selectedRef?.id}</Text>
                        <Text c="dimmed" size="sm">
                            {selectedRef?.description ?? ""}
                        </Text>
                    </Stack>


                </Collapse>
            </Stack>

            <Divider />

            <Stack gap="xl">
                <Stack gap="sm">
                    <Group justify="space-between" align="center">
                        <Text fw={600}>Instructions</Text>
                        {selectedRef && selectedIsBranch && (
                            <Group gap="xs">
                                {currentInstructions !== selectedRef.instructions && (
                                    <Button
                                        color="orange"
                                        variant="light"
                                        size="xs"
                                        onClick={() => {
                                            if (window.confirm("초기 상태로 되돌리시겠습니까? 저장하지 않은 내용은 사라집니다.")) {
                                                try {
                                                    const key = `playground_override_${promptId}_${selectedRef.id}`;
                                                    sessionStorage.removeItem(key);
                                                } catch { }
                                                setCurrentInstructions(selectedRef.instructions);
                                            }
                                        }}
                                    >
                                        수정됨 (되돌리기)
                                    </Button>
                                )}
                                <Button
                                    size="xs"
                                    type="submit"
                                    form="prompt-editor-form"
                                    loading={updateRefMutation.isPending}
                                >
                                    저장
                                </Button>
                            </Group>
                        )}
                    </Group>
                    {refsLoading ? (
                        <Loader />
                    ) : !selectedRef ? (
                        <Alert title="Ref 없음" color="yellow">
                            선택된 Ref가 없습니다. 먼저 Ref를 생성해 주세요.
                        </Alert>
                    ) : selectedIsBranch && loadedRefId === selectedRef.id ? ( // Only render Editor when initialized
                        <PromptEditor
                            key={selectedRef.id}
                            formId="prompt-editor-form"
                            hideLabel
                            hideSaveButton
                            initialInstructions={currentInstructions}
                            onSave={(instructions) =>
                                updateRefMutation.mutate({
                                    refId: selectedRef.id,
                                    instructions,
                                })
                            }
                            onChange={(val) => setCurrentInstructions(val)}
                            isSaving={updateRefMutation.isPending}
                        />
                    ) : (
                        <Textarea
                            value={selectedRef.instructions}
                            minRows={10}
                            autosize
                            readOnly
                        />
                    )}
                </Stack>

                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text fw={600}>Additional Input Items</Text>
                        <Button
                            size="xs"
                            onClick={() => {
                                setEditingInput(null);
                                inputForm.setValues({
                                    position: null,
                                    role: "USER",
                                    message: "",
                                });
                                setInputModalOpen(true);
                            }}
                            disabled={!selectedRef || !selectedIsBranch}
                        >
                            입력 추가
                        </Button>
                    </Group>
                    {additionalInputsLoading ? (
                        <Loader />
                    ) : orderedInputs.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            추가 입력이 없습니다.
                        </Text>
                    ) : (
                        <Table striped highlightOnHover withTableBorder>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Position</Table.Th>
                                    <Table.Th>Role</Table.Th>
                                    <Table.Th>Message</Table.Th>
                                    <Table.Th ta="right">Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {orderedInputs.map((item) => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>{item.position}</Table.Td>
                                        <Table.Td>{item.role}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={2}>
                                                {item.message}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            {selectedIsBranch ? (
                                                <Menu position="bottom-end" shadow="md" width={140}>
                                                    <Menu.Target>
                                                        <ActionIcon variant="subtle" aria-label="actions">
                                                            <IconDotsVertical size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            onClick={() => {
                                                                setEditingInput(item);
                                                                inputForm.setValues({
                                                                    position: item.position,
                                                                    role: item.role,
                                                                    message: item.message,
                                                                });
                                                                setInputModalOpen(true);
                                                            }}
                                                        >
                                                            수정
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            color="red"
                                                            onClick={() =>
                                                                deleteInputMutation.mutate({ id: item.id })
                                                            }
                                                        >
                                                            삭제
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            ) : (
                                                <Text size="sm" c="dimmed">
                                                    TAG는 읽기 전용
                                                </Text>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Stack>
            </Stack>

            <Modal opened={refPickerOpen} onClose={() => setRefPickerOpen(false)} title="Reference 선택">
                <Tabs defaultValue="BRANCH">
                    <Tabs.List>
                        <Tabs.Tab value="BRANCH">Branch</Tabs.Tab>
                        <Tabs.Tab value="TAG">Tag</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="BRANCH" pt="md">
                        <Stack>
                            {branchRefs.length === 0 ? (
                                <Text c="dimmed">등록된 Branch가 없습니다.</Text>
                            ) : (
                                branchRefs.map((ref) => (
                                    <Group key={ref.id} justify="space-between" align="center">
                                        <Stack gap={2}>
                                            <Group gap="xs" align="center">
                                                <Text fw={500}>{ref.name}</Text>
                                                {ref.id === selectedRefId && (
                                                    <Text size="xs" c="blue">
                                                        선택됨
                                                    </Text>
                                                )}
                                            </Group>
                                            {ref.description && (
                                                <Text size="xs" c="dimmed">
                                                    {ref.description}
                                                </Text>
                                            )}
                                        </Stack>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                variant="light"
                                                onClick={() => {
                                                    setDiffLeftId(ref.id);
                                                    setDiffRightId(selectedRef?.id ?? ref.id);
                                                    setDiffOpen(true);
                                                }}
                                                leftSection={<IconArrowsDiff size={14} />}
                                            >
                                                비교
                                            </Button>
                                            <Button
                                                size="xs"
                                                onClick={() => {
                                                    setSelectedRefId(ref.id);
                                                    setRefPickerOpen(false);
                                                }}
                                            >
                                                선택
                                            </Button>
                                        </Group>
                                    </Group>
                                ))
                            )}
                        </Stack>
                    </Tabs.Panel>
                    <Tabs.Panel value="TAG" pt="md">
                        <Stack>
                            {tagRefs.length === 0 ? (
                                <Text c="dimmed">등록된 Tag가 없습니다.</Text>
                            ) : (
                                tagRefs.map((ref) => (
                                    <Group key={ref.id} justify="space-between" align="center">
                                        <Stack gap={2}>
                                            <Group gap="xs" align="center">
                                                <Text fw={500}>{ref.name}</Text>
                                                {ref.id === selectedRefId && (
                                                    <Text size="xs" c="blue">
                                                        선택됨
                                                    </Text>
                                                )}
                                                {latestTagRefId && ref.id === latestTagRefId && (
                                                    <Text size="xs" c="teal">
                                                        최신
                                                    </Text>
                                                )}
                                            </Group>
                                            {ref.description && (
                                                <Text size="xs" c="dimmed">
                                                    {ref.description}
                                                </Text>
                                            )}
                                        </Stack>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                variant="light"
                                                onClick={() => {
                                                    setDiffLeftId(ref.id);
                                                    setDiffRightId(selectedRef?.id ?? ref.id);
                                                    setDiffOpen(true);
                                                }}
                                                leftSection={<IconArrowsDiff size={14} />}
                                            >
                                                비교
                                            </Button>
                                            <Button
                                                size="xs"
                                                onClick={() => {
                                                    setSelectedRefId(ref.id);
                                                    setRefPickerOpen(false);
                                                }}
                                            >
                                                선택
                                            </Button>
                                        </Group>
                                    </Group>
                                ))
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Modal>

            <Modal
                opened={createRefState.opened}
                onClose={() => setCreateRefState((prev) => ({ ...prev, opened: false }))}
                title={`새 ${createRefState.type}`}
            >
                <form
                    onSubmit={createRefForm.onSubmit((values) => {
                        if (!selectedRefId) {
                            return;
                        }
                        createRefMutation.mutate({
                            name: values.name,
                            description: values.description || undefined,
                            type: createRefState.type,
                        });
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...createRefForm.getInputProps("name")} />
                        <TextInput
                            label="Description"
                            {...createRefForm.getInputProps("description")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={createRefMutation.isPending}>
                                생성
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={promptEditOpen} onClose={() => setPromptEditOpen(false)} title="Prompt 수정">
                <form
                    onSubmit={promptForm.onSubmit((values) =>
                        updatePromptMutation.mutate({
                            name: values.name,
                            description: values.description || undefined,
                        }),
                    )}
                >
                    <Stack>
                        <TextInput label="Name" required {...promptForm.getInputProps("name")} />
                        <Textarea
                            label="설명"
                            autosize
                            {...promptForm.getInputProps("description")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updatePromptMutation.isPending}>
                                저장
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={promptDeleteOpen}
                onClose={() => setPromptDeleteOpen(false)}
                title="Prompt 삭제"
            >
                <Stack>
                    <Text>{prompt?.name ?? "Prompt"} 을(를) 삭제하시겠습니까?</Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setPromptDeleteOpen(false)}>
                            취소
                        </Button>
                        <Button
                            color="red"
                            loading={deletePromptMutation.isPending}
                            onClick={() => deletePromptMutation.mutate()}
                        >
                            삭제
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={refEditOpen} onClose={() => setRefEditOpen(false)} title="Ref 수정">
                <form
                    onSubmit={refMetaForm.onSubmit((values) => {
                        if (!selectedRef) {
                            return;
                        }
                        updateRefMetaMutation.mutate({
                            refId: selectedRef.id,
                            name: values.name,
                            description: values.description || undefined,
                        });
                    })}
                >
                    <Stack>
                        <TextInput label="Name" required {...refMetaForm.getInputProps("name")} />
                        <Textarea
                            label="설명"
                            autosize
                            {...refMetaForm.getInputProps("description")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit" loading={updateRefMetaMutation.isPending}>
                                저장
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Ref 삭제">
                <Stack>
                    <Text>{deleteTarget?.name} ref 를 삭제하시겠습니까?</Text>
                    {deleteTarget?.id === prompt?.defaultBranchRefId && (
                        <Alert title="삭제 불가" color="yellow">
                            기본 브랜치는 삭제할 수 없습니다.
                        </Alert>
                    )}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteTarget(null)}>
                            취소
                        </Button>
                        <Button
                            color="red"
                            loading={deleteRefMutation.isPending}
                            disabled={deleteTarget?.id === prompt?.defaultBranchRefId}
                            onClick={() => {
                                if (deleteTarget) {
                                    deleteRefMutation.mutate(deleteTarget.id);
                                }
                            }}
                        >
                            삭제
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={inputModalOpen}
                onClose={() => {
                    setInputModalOpen(false);
                    setEditingInput(null);
                }}
                title={editingInput ? "추가 입력 수정" : "추가 입력 생성"}
                size="xl"
            >
                <form
                    onSubmit={inputForm.onSubmit((values) => {
                        if (!selectedRefId) {
                            return;
                        }
                        if (editingInput) {
                            updateInputMutation.mutate({
                                id: editingInput.id,
                                position: values.position ?? undefined,
                                role: values.role,
                                message: values.message,
                            });
                        } else {
                            addInputMutation.mutate({
                                position: values.position ?? undefined,
                                role: values.role,
                                message: values.message,
                            });
                        }
                    })}
                >
                    <Stack>
                        <NumberInput
                            label="Position"
                            min={0}
                            placeholder="비우면 마지막 위치로 추가"
                            {...inputForm.getInputProps("position")}
                        />
                        <Select label="Role" data={roleOptions} {...inputForm.getInputProps("role")} />
                        <Textarea
                            label="Message"
                            minRows={4}
                            autosize
                            {...inputForm.getInputProps("message")}
                        />
                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                loading={addInputMutation.isPending || updateInputMutation.isPending}
                            >
                                저장
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={diffOpen} onClose={() => setDiffOpen(false)} title="Ref 비교" size="xl">
                <Stack>
                    <Group grow>
                        <Select
                            label="Left Ref"
                            data={refs.map((ref) => ({
                                value: String(ref.id),
                                label: `${ref.name} (${ref.type})`,
                            }))}
                            value={diffLeftId ? String(diffLeftId) : null}
                            onChange={(value) => setDiffLeftId(value ? Number(value) : null)}
                        />
                        <Select
                            label="Right Ref"
                            data={refs.map((ref) => ({
                                value: String(ref.id),
                                label: `${ref.name} (${ref.type})`,
                            }))}
                            value={diffRightId ? String(diffRightId) : null}
                            onChange={(value) => setDiffRightId(value ? Number(value) : null)}
                        />
                    </Group>
                    <Table withTableBorder striped>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={56}>#</Table.Th>
                                <Table.Th>Left</Table.Th>
                                <Table.Th w={56}>#</Table.Th>
                                <Table.Th>Right</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {diffRows.map((row, index) => {
                                const backgroundColor =
                                    row.status === "same"
                                        ? undefined
                                        : row.status === "added"
                                            ? "var(--mantine-color-teal-light)"
                                            : row.status === "removed"
                                                ? "var(--mantine-color-red-light)"
                                                : "var(--mantine-color-yellow-light)";

                                const leftLineNo = row.left ? String(index + 1) : "";
                                const rightLineNo = row.right ? String(index + 1) : "";

                                return (
                                    <Table.Tr key={`${index}-${row.status}`} style={{ backgroundColor }}>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {leftLineNo}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text className="font-mono" size="xs">
                                                {row.left}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {rightLineNo}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text className="font-mono" size="xs">
                                                {row.right}
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Modal>
        </Stack>
    );
}
