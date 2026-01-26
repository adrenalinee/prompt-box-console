"use client";

import React from "react";
import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Menu,
    Modal,
    NumberInput,
    Paper,
    ScrollArea,
    Select,
    Stack,
    Table,
    Tabs,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconAdjustments,
    IconDotsVertical,
    IconFileText,
    IconGitBranch,
    IconSearch,
    IconServer,
} from "@tabler/icons-react";
import type { AdditionalInputItem, Prompt, PromptRef } from "@/lib/api/prompts";
import type { ApiKey, Model, Vendor } from "@/lib/api/settings";
import type { DefaultOptions } from "@/lib/api/workspaces";
import {
    addAdditionalInput,
    createPrompt,
    createRef,
    deleteAdditionalInput,
    updateAdditionalInput,
    updateRef,
} from "@/lib/api/prompts";
import { showNotification } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

type InputItemForm = {
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
};

export type ExecuteFormValues = {
    promptId: string;
    refId: string;
    instructions: string;
    modelId: string;
    apiKeyId: string;
    inputItems: InputItemForm[];
    overrideOptions: {
        temperature: number | null;
        topP: number | null;
        maxTokens: number | null;
        textFormat: string;
        effort: string;
        verbosity: string;
        summary: string;
    };
};

type ExecutePanelProps = {
    workspaceId: string;
    prompts: Prompt[];
    selectedPromptId: string;
    onPromptChange?: (promptId: string) => void;
    refs: PromptRef[];
    selectedRefId: string;
    onRefChange?: (refId: string) => void;
    models: Model[];
    selectedModelId?: string;
    onModelChange?: (modelId: string) => void;
    apiKeys: ApiKey[];
    selectedApiKeyId?: string;
    onApiKeyChange?: (apiKeyId: string) => void;
    vendors: Vendor[];
    vendorId?: string;
    onVendorChange?: (vendorId: string | null) => void;
    defaultOptions?: DefaultOptions | null;
    additionalInputs?: AdditionalInputItem[];
    onExecute: (values: {
        refId?: number;
        instructions?: string;
        modelId: string;
        apiKeyId: string;
        inputItems: InputItemForm[];
        overrideOptions?: {
            temperature?: number;
            topP?: number;
            maxTokens?: number;
            textFormat?: string;
            effort?: string;
            verbosity?: string;
            summary?: string;
        };
    }) => void;
};

export function ExecutePanel({
    workspaceId,
    prompts,
    selectedPromptId,
    onPromptChange,
    refs,
    selectedRefId,
    onRefChange,
    models,
    selectedModelId,
    onModelChange,
    apiKeys,
    selectedApiKeyId,
    onApiKeyChange,
    vendors,
    vendorId,
    onVendorChange,
    defaultOptions,
    additionalInputs,
    onExecute,
}: ExecutePanelProps) {
    const queryClient = useQueryClient();
    const promptChangeRef = React.useRef<{ id: string; name?: string } | null>(null);
    const [confirmPromptChangeOpen, setConfirmPromptChangeOpen] = React.useState(false);
    const [createPromptOpen, setCreatePromptOpen] = React.useState(false);
    const [createRefOpen, setCreateRefOpen] = React.useState<{
        type: "TAG" | "BRANCH";
    } | null>(null);
    const [promptSubmitLocked, setPromptSubmitLocked] = React.useState(false);
    const safeRefs = Array.isArray(refs) ? refs : [];
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const [promptModalOpen, setPromptModalOpen] = React.useState(false);
    const [refModalOpen, setRefModalOpen] = React.useState(false);
    const [modelModalOpen, setModelModalOpen] = React.useState(false);
    const [optionsModalOpen, setOptionsModalOpen] = React.useState(false);
    const [promptSearch, setPromptSearch] = React.useState("");
    const [modelSearch, setModelSearch] = React.useState("");
    const [refBaselineInstructions, setRefBaselineInstructions] = React.useState("");
    const [refBaselineInputs, setRefBaselineInputs] = React.useState<InputItemForm[]>([]);

    const form = useForm<ExecuteFormValues>({
        initialValues: {
            promptId: selectedPromptId ?? "",
            refId: selectedRefId ?? "",
            instructions: "",
            modelId: selectedModelId ?? (models[0] ? String(models[0].id) : ""),
            apiKeyId: selectedApiKeyId ?? apiKeys[0]?.id ?? "",
            inputItems: [{ role: "USER", message: "" }],
            overrideOptions: {
                temperature: null,
                topP: null,
                maxTokens: null,
                textFormat: "",
                effort: "",
                verbosity: "",
                summary: "",
            },
        },
    });

    const promptForm = useForm({
        initialValues: {
            name: "",
            description: "",
            mainRefName: "main",
        },
        validate: {
            name: (value) => (!value.trim() ? "프롬프트 이름을 입력해주세요." : null),
        },
    });

    const refForm = useForm({
        initialValues: {
            name: "",
            description: "",
        },
        validate: {
            name: (value) => (!value.trim() ? "이름을 입력해주세요." : null),
        },
    });

    React.useEffect(() => {
        form.setFieldValue("promptId", selectedPromptId ?? "");
    }, [selectedPromptId]);

    React.useEffect(() => {
        form.setFieldValue("refId", selectedRefId ?? "");
    }, [selectedRefId]);

    React.useEffect(() => {
        if (selectedModelId !== undefined) {
            form.setFieldValue("modelId", selectedModelId);
        }
    }, [selectedModelId]);

    React.useEffect(() => {
        if (selectedApiKeyId !== undefined) {
            form.setFieldValue("apiKeyId", selectedApiKeyId);
        }
    }, [selectedApiKeyId]);

    const selectedRef = safeRefs.find((ref) => String(ref.id) === form.values.refId);

    React.useEffect(() => {
        if (!selectedRef) {
            if (!form.values.promptId) {
                setRefBaselineInstructions("");
                form.setFieldValue("instructions", "");
                setRefBaselineInputs([]);
            }
            return;
        }
        setRefBaselineInstructions(selectedRef.instructions ?? "");
        form.setFieldValue("instructions", selectedRef.instructions ?? "");
    }, [selectedRef?.id, selectedRef?.instructions]);

    React.useEffect(() => {
        if (!selectedRefId) return;
        if (additionalInputs && additionalInputs.length > 0) {
            const nextItems = additionalInputs.map((item) => ({
                role: item.role,
                message: item.message,
            }));
            form.setFieldValue("inputItems", nextItems);
            setRefBaselineInputs(nextItems);
        } else {
            const defaultItems = [{ role: "USER", message: "" }];
            form.setFieldValue("inputItems", defaultItems);
            setRefBaselineInputs(defaultItems);
        }
    }, [selectedRefId, additionalInputs]);

    React.useEffect(() => {
        if (!models.length) {
            form.setFieldValue("modelId", "");
            onModelChange?.("");
            return;
        }
        if (!models.find((model) => String(model.id) === form.values.modelId)) {
            form.setFieldValue("modelId", String(models[0].id));
            onModelChange?.(String(models[0].id));
            return;
        }
        onModelChange?.(form.values.modelId);
    }, [models, form.values.modelId, onModelChange]);

    const selectedModel = models.find((model) => String(model.id) === form.values.modelId);

    React.useEffect(() => {
        if (!selectedModel) return;
        const vendorKeys = apiKeys.filter((key) => key.vendorId === selectedModel.vendorId);
        if (vendorKeys.length === 0) {
            form.setFieldValue("apiKeyId", "");
            onApiKeyChange?.("");
            return;
        }
        if (!vendorKeys.find((key) => key.id === form.values.apiKeyId)) {
            form.setFieldValue("apiKeyId", vendorKeys[0].id);
            onApiKeyChange?.(vendorKeys[0].id);
        }
    }, [selectedModel, apiKeys]);

    React.useEffect(() => {
        if (!defaultOptions && form.values.overrideOptions.temperature !== null) return;
        const fallback = {
            temperature: 1,
            topP: 0,
            maxTokens: 3000,
            textFormat: "",
            effort: "LOW",
            verbosity: "LOW",
            summary: "AUTO",
        };
        form.setFieldValue("overrideOptions.temperature", defaultOptions?.temperature ?? fallback.temperature);
        form.setFieldValue("overrideOptions.topP", defaultOptions?.topP ?? fallback.topP);
        form.setFieldValue("overrideOptions.maxTokens", defaultOptions?.maxTokens ?? fallback.maxTokens);
        form.setFieldValue("overrideOptions.textFormat", defaultOptions?.textFormat ?? fallback.textFormat);
        form.setFieldValue("overrideOptions.effort", defaultOptions?.effort ?? fallback.effort);
        form.setFieldValue("overrideOptions.verbosity", defaultOptions?.verbosity ?? fallback.verbosity);
        form.setFieldValue("overrideOptions.summary", defaultOptions?.summary ?? fallback.summary);
    }, [defaultOptions]);

    const selectedKey = apiKeys.find((key) => key.id === form.values.apiKeyId);
    const selectedVendorName = selectedModel
        ? vendorMap.get(selectedModel.vendorId) ?? selectedModel.vendorId
        : "-";

    const selectedPrompt = prompts.find((prompt) => prompt.id === form.values.promptId);
    const promptLabel = selectedPrompt ? `Prompt: ${selectedPrompt.name}` : "Prompt 선택";
    const refLabel = selectedRef ? `Ref: ${selectedRef.name} (${selectedRef.type})` : "Ref 선택";

    const apiKeyLabel = selectedKey
        ? selectedKey.name
            ? `${selectedKey.name}`
            : selectedKey.id
        : "-";

    const optionSummary = [
        { label: "temperature", value: form.values.overrideOptions.temperature ?? "-" },
        { label: "topP", value: form.values.overrideOptions.topP ?? "-" },
        { label: "maxTokens", value: form.values.overrideOptions.maxTokens ?? "-" },
        { label: "textFormat", value: form.values.overrideOptions.textFormat || "-" },
        { label: "effort", value: form.values.overrideOptions.effort || "-" },
        { label: "verbosity", value: form.values.overrideOptions.verbosity || "-" },
        { label: "summary", value: form.values.overrideOptions.summary || "-" },
    ];

    const filteredPrompts = prompts.filter((prompt) =>
        prompt.name.toLowerCase().includes(promptSearch.toLowerCase()),
    );
    const filteredModels = models.filter((model) => {
        if (vendorId && model.vendorId !== vendorId) return false;
        const keyword = modelSearch.toLowerCase();
        return (
            model.name.toLowerCase().includes(keyword) ||
            model.modelKey.toLowerCase().includes(keyword)
        );
    });
    const vendorKeySet = new Set(apiKeys.map((key) => key.vendorId));
    const apiKeyOptions = apiKeys
        .filter((key) => (selectedModel ? key.vendorId === selectedModel.vendorId : true))
        .map((key) => ({
            value: key.id,
            label: `${vendorMap.get(key.vendorId) ?? key.vendorId}${
                key.name ? ` / ${key.name}` : ""
            }`,
        }));

    const selectedKeyLabel = selectedKey
        ? `${vendorMap.get(selectedKey.vendorId) ?? selectedKey.vendorId} / ${
              selectedKey.name || selectedKey.id
          }`
        : "-";

    const isModified =
        !!form.values.promptId &&
        !!form.values.refId &&
        (form.values.instructions.trim() !== refBaselineInstructions.trim() ||
            JSON.stringify(form.values.inputItems) !== JSON.stringify(refBaselineInputs));
    const canUseRefActions = !!form.values.promptId && !!form.values.refId;
    const canSaveChanges = canUseRefActions && isModified && selectedRef?.type === "BRANCH";
    const canCreateTag = canUseRefActions && selectedRef?.type === "BRANCH";

    const syncAdditionalInputs = async (promptId: string, refId: number) => {
        const existing = additionalInputs ?? [];
        const next = form.values.inputItems.map((item, index) => ({
            position: index + 1,
            role: item.role,
            message: item.message,
        }));

        const updates = next.slice(0, existing.length);
        const toDelete = existing.slice(next.length);
        const toAdd = next.slice(existing.length);

        await Promise.all(
            updates.map((item, index) =>
                updateAdditionalInput(promptId, refId, existing[index].id, item),
            ),
        );
        await Promise.all(toDelete.map((item) => deleteAdditionalInput(promptId, refId, item.id)));
        await Promise.all(toAdd.map((item) => addAdditionalInput(promptId, refId, item)));
    };

    const handleSelectPrompt = (promptId: string) => {
        form.setFieldValue("promptId", promptId);
        form.setFieldValue("refId", "");
        setPromptModalOpen(false);
        onPromptChange?.(promptId);
        onRefChange?.("");
    };

    const requestPromptChange = (promptId: string, name?: string) => {
        if (isModified && promptId !== form.values.promptId) {
            promptChangeRef.current = { id: promptId, name };
            setPromptModalOpen(false);
            setConfirmPromptChangeOpen(true);
            return;
        }
        handleSelectPrompt(promptId);
    };

    return (
        <form
            id="playground-execute-form"
            onSubmit={form.onSubmit((values) => {
                const options = {
                    temperature: values.overrideOptions.temperature ?? undefined,
                    topP: values.overrideOptions.topP ?? undefined,
                    maxTokens: values.overrideOptions.maxTokens ?? undefined,
                    textFormat: values.overrideOptions.textFormat || undefined,
                    effort: values.overrideOptions.effort || undefined,
                    verbosity: values.overrideOptions.verbosity || undefined,
                    summary: values.overrideOptions.summary || undefined,
                };
                const hasOptions = Object.values(options).some((value) => value !== undefined);
                const useRef =
                    !!values.promptId &&
                    !!values.refId &&
                    values.instructions.trim() === refBaselineInstructions.trim();

                onExecute({
                    refId: useRef ? Number(values.refId) : undefined,
                    instructions: useRef ? undefined : values.instructions || undefined,
                    modelId: values.modelId,
                    apiKeyId: values.apiKeyId,
                    inputItems: values.inputItems,
                    overrideOptions: hasOptions ? options : undefined,
                });
            })}
        >
            <Stack>
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <Button
                            variant="default"
                            leftSection={<IconServer size={16} />}
                            onClick={() => setModelModalOpen(true)}
                        >
                            {selectedModel ? `모델: ${selectedModel.name}` : "모델 선택"}
                        </Button>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                            {selectedKeyLabel}
                        </Text>
                    </Group>
                    <ActionIcon variant="light" onClick={() => setOptionsModalOpen(true)}>
                        <IconAdjustments size={16} />
                    </ActionIcon>
                </Group>

                <Group justify="space-between" align="flex-start" style={{ flexWrap: "nowrap" }}>
                    <Text size="xs" style={{ flex: 1, lineHeight: 1.4 }}>
                        {optionSummary.map((item, index) => (
                            <Text key={item.label} span>
                                <Text span c="dimmed">
                                    {item.label}
                                </Text>
                                <Text span c="dark">
                                    {` ${item.value}`}
                                </Text>
                                {index < optionSummary.length - 1 ? " · " : ""}
                            </Text>
                        ))}
                    </Text>
                </Group>

                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <Button
                            variant="default"
                            leftSection={<IconFileText size={16} />}
                            onClick={() => setPromptModalOpen(true)}
                        >
                            {promptLabel}
                        </Button>
                        <Button
                            variant="default"
                            leftSection={<IconGitBranch size={16} />}
                            disabled={!form.values.promptId}
                            onClick={() => setRefModalOpen(true)}
                        >
                            {refLabel}
                        </Button>
                    </Group>
                    <Group gap="xs">
                        {isModified && <Badge color="orange">수정됨</Badge>}
                        <Menu shadow="md" position="bottom-end" width={280}>
                            <Menu.Target>
                                <ActionIcon variant="light">
                                    <IconDotsVertical size={16} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item
                                    onClick={() => {
                                        promptForm.reset();
                                        setCreatePromptOpen(true);
                                    }}
                                >
                                    <Text fw={500}>새 프롬프트 생성</Text>
                                    <Text size="xs" c="dimmed">
                                        현재 입력된 내용으로 새로운 프롬프트를 생성합니다.
                                    </Text>
                                </Menu.Item>
                                <Menu.Item
                                    disabled={!canCreateTag}
                                    onClick={() => {
                                        refForm.reset();
                                        setCreateRefOpen({ type: "TAG" });
                                    }}
                                >
                                    <Text fw={500}>tag 생성</Text>
                                    <Text size="xs" c="dimmed">
                                        현재 branch의 내용을 태그로 고정합니다.
                                    </Text>
                                </Menu.Item>
                                <Menu.Item disabled={!canSaveChanges}
                                    onClick={async () => {
                                        try {
                                            if (!form.values.promptId || !form.values.refId) return;
                                            const refId = Number(form.values.refId);
                                            await updateRef(form.values.promptId, refId, {
                                                instructions: form.values.instructions,
                                            });
                                            await syncAdditionalInputs(form.values.promptId, refId);
                                            showNotification({
                                                color: "teal",
                                                title: "저장 완료",
                                                message: "수정내역이 저장되었습니다.",
                                            });
                                        } catch (error) {
                                            if (error && typeof error === "object" && "status" in error) {
                                                return;
                                            }
                                            showNotification({
                                                color: "red",
                                                title: "오류",
                                                message: "저장 중 문제가 발생했습니다.",
                                            });
                                        }
                                    }}
                                >
                                    <Text fw={500}>수정내역 저장</Text>
                                    <Text size="xs" c="dimmed">
                                        수정된 내용을 현재 branch에 저장합니다.
                                    </Text>
                                </Menu.Item>
                                <Menu.Item
                                    disabled={!canUseRefActions}
                                    onClick={() => {
                                        refForm.reset();
                                        setCreateRefOpen({ type: "BRANCH" });
                                    }}
                                >
                                    <Text fw={500}>새 branch</Text>
                                    <Text size="xs" c="dimmed">
                                        현재 수정된 내용으로 새로운 branch를 생성합니다.
                                    </Text>
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>

                <Textarea
                    label="Instructions"
                    minRows={6}
                    autosize
                    {...form.getInputProps("instructions")}
                />

                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text fw={600}>Input Items</Text>
                        <Button
                            size="xs"
                            variant="light"
                            onClick={() =>
                                form.insertListItem("inputItems", {
                                    role: "USER",
                                    message: "",
                                })
                            }
                        >
                            입력 추가
                        </Button>
                    </Group>
                    {form.values.inputItems.map((item, index) => (
                        <Paper key={`input-${index}`} withBorder p="sm">
                            <Group justify="space-between" align="center">
                                <Select
                                    label="Role"
                                    data={[
                                        { value: "USER", label: "USER" },
                                        { value: "ASSISTANT", label: "ASSISTANT" },
                                        { value: "SYSTEM", label: "SYSTEM" },
                                        { value: "DEVELOPER", label: "DEVELOPER" },
                                    ]}
                                    w={160}
                                    {...form.getInputProps(`inputItems.${index}.role`)}
                                />
                                <Menu shadow="md" position="bottom-end">
                                    <Menu.Target>
                                        <ActionIcon variant="light">
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item
                                            color="red"
                                            disabled={form.values.inputItems.length === 1}
                                            onClick={() => form.removeListItem("inputItems", index)}
                                        >
                                            삭제
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                            <Textarea
                                label="Message"
                                minRows={3}
                                autosize
                                {...form.getInputProps(`inputItems.${index}.message`)}
                            />
                        </Paper>
                    ))}
                </Stack>
            </Stack>

            <Modal
                opened={promptModalOpen}
                onClose={() => setPromptModalOpen(false)}
                title="Prompt 선택"
                size="lg"
            >
                <Stack>
                    <TextInput
                        placeholder="Prompt 검색"
                        leftSection={<IconSearch size={16} />}
                        value={promptSearch}
                        onChange={(event) => setPromptSearch(event.currentTarget.value)}
                    />
                    <ScrollArea h={360}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th ta="right">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredPrompts.map((prompt) => (
                                    <Table.Tr key={prompt.id}>
                                        <Table.Td>{prompt.name}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {prompt.description ?? "-"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end">
                                                {prompt.id === form.values.promptId && (
                                                    <Text size="xs" c="teal">
                                                        선택됨
                                                    </Text>
                                                )}
                                                <Button
                                                    size="xs"
                                                    onClick={() => {
                                                        requestPromptChange(prompt.id, prompt.name);
                                                    }}
                                                >
                                                    선택
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => {
                                requestPromptChange("", "");
                            }}
                        >
                            선택 해제
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={refModalOpen}
                onClose={() => setRefModalOpen(false)}
                title={selectedPrompt ? `${selectedPrompt.name} · Ref 선택` : "Ref 선택"}
                size="lg"
            >
                <Tabs defaultValue="BRANCH">
                    <Tabs.List>
                        <Tabs.Tab value="BRANCH">Branches</Tabs.Tab>
                        <Tabs.Tab value="TAG">Tags</Tabs.Tab>
                    </Tabs.List>
                    {(["BRANCH", "TAG"] as const).map((type) => (
                        <Tabs.Panel key={type} value={type} pt="md">
                            <ScrollArea h={320}>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Name</Table.Th>
                                            <Table.Th>Description</Table.Th>
                                            <Table.Th ta="right">Action</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {safeRefs
                                            .filter((ref) => ref.type === type)
                                            .map((ref) => (
                                                <Table.Tr key={ref.id}>
                                                    <Table.Td>{ref.name}</Table.Td>
                                                    <Table.Td>
                                                        <Text size="xs" c="dimmed">
                                                            {ref.description ?? "-"}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td ta="right">
                                                        <Group justify="flex-end" gap="xs">
                                                            {String(ref.id) === form.values.refId && (
                                                                <Text size="xs" c="teal">
                                                                    선택됨
                                                                </Text>
                                                            )}
                                                        <Button
                                                            size="xs"
                                                            onClick={() => {
                                                                form.setFieldValue(
                                                                    "refId",
                                                                    String(ref.id),
                                                                );
                                                                setRefModalOpen(false);
                                                                onRefChange?.(String(ref.id));
                                                            }}
                                                        >
                                                            선택
                                                        </Button>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </Tabs.Panel>
                    ))}
                </Tabs>
                <Group justify="flex-end" mt="md">
                    <Button
                        variant="default"
                        onClick={() => {
                            form.setFieldValue("refId", "");
                            setRefModalOpen(false);
                            onRefChange?.("");
                        }}
                    >
                        선택 해제
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={modelModalOpen}
                onClose={() => setModelModalOpen(false)}
                title="모델 선택"
                size="xl"
            >
                <Stack>
                    <Group grow>
                        <Select
                            label="Vendor"
                            data={vendorOptions}
                            value={vendorId ?? null}
                            onChange={onVendorChange}
                            clearable
                        />
                        <TextInput
                            label="모델 검색"
                            placeholder="모델 이름 또는 키"
                            leftSection={<IconSearch size={16} />}
                            value={modelSearch}
                            onChange={(event) => setModelSearch(event.currentTarget.value)}
                        />
                    </Group>
                    <Select
                        label="API Key 선택"
                        placeholder="API Key 선택"
                        data={apiKeyOptions}
                        value={form.values.apiKeyId || null}
                        onChange={(value) => {
                            form.setFieldValue("apiKeyId", value ?? "");
                            onApiKeyChange?.(value ?? "");
                        }}
                        clearable
                    />
                    <ScrollArea h={360}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Vendor</Table.Th>
                                    <Table.Th>Model</Table.Th>
                                    <Table.Th>Model Key</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th ta="right">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredModels.map((model) => {
                                    const vendorName =
                                        vendorMap.get(model.vendorId) ?? model.vendorId;
                                    const hasApiKey = vendorKeySet.has(model.vendorId);
                                    const isSelected = String(model.id) === form.values.modelId;
                                    return (
                                        <Table.Tr
                                            key={model.id}
                                            style={{
                                                opacity: hasApiKey ? 1 : 0.4,
                                            }}
                                        >
                                            <Table.Td>{vendorName}</Table.Td>
                                            <Table.Td>{model.name}</Table.Td>
                                            <Table.Td>{model.modelKey}</Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">
                                                    {model.description ?? "-"}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td ta="right">
                                                <Group gap="xs" justify="flex-end">
                                                    {isSelected && (
                                                        <Text size="xs" c="teal">
                                                            선택됨
                                                        </Text>
                                                    )}
                                                    <Button
                                                        size="xs"
                                                        disabled={!hasApiKey}
                                                        onClick={() => {
                                                            form.setFieldValue(
                                                                "modelId",
                                                                String(model.id),
                                                            );
                                                            onModelChange?.(String(model.id));
                                                            if (
                                                                !apiKeyOptions.find(
                                                                    (key) =>
                                                                        key.value ===
                                                                            form.values.apiKeyId,
                                                                )
                                                            ) {
                                                                const nextKey = apiKeys.find(
                                                                    (key) =>
                                                                        key.vendorId ===
                                                                        model.vendorId,
                                                                );
                                                                form.setFieldValue(
                                                                    "apiKeyId",
                                                                    nextKey?.id ?? "",
                                                                );
                                                                onApiKeyChange?.(nextKey?.id ?? "");
                                                            }
                                                            setModelModalOpen(false);
                                                        }}
                                                    >
                                                        선택
                                                    </Button>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Stack>
            </Modal>

            <Modal
                opened={optionsModalOpen}
                onClose={() => setOptionsModalOpen(false)}
                title="LLM Call Options"
                size="lg"
            >
                <Stack>
                    <Group grow>
                        <NumberInput
                            label="temperature"
                            description="기본값: workspace defaultOptions"
                            decimalScale={2}
                            min={0}
                            {...form.getInputProps("overrideOptions.temperature")}
                        />
                        <NumberInput
                            label="topP"
                            description="0~1 범위의 샘플링 확률"
                            min={0}
                            {...form.getInputProps("overrideOptions.topP")}
                        />
                        <NumberInput
                            label="maxTokens"
                            description="최대 출력 토큰 수"
                            min={0}
                            {...form.getInputProps("overrideOptions.maxTokens")}
                        />
                    </Group>
                    <Group grow>
                        <TextInput
                            label="textFormat"
                            description="예: markdown, plain"
                            {...form.getInputProps("overrideOptions.textFormat")}
                        />
                        <Select
                            label="effort"
                            description="응답 난이도/노력 수준"
                            data={[
                                { value: "DEFAULT", label: "DEFAULT" },
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                            ]}
                            clearable
                            value={form.values.overrideOptions.effort || null}
                            onChange={(value) =>
                                form.setFieldValue("overrideOptions.effort", value ?? "")
                            }
                        />
                        <Select
                            label="verbosity"
                            description="응답 길이 수준"
                            data={[
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                            ]}
                            clearable
                            value={form.values.overrideOptions.verbosity || null}
                            onChange={(value) =>
                                form.setFieldValue("overrideOptions.verbosity", value ?? "")
                            }
                        />
                    </Group>
                    <Select
                        label="summary"
                        description="요약 스타일"
                        data={[
                            { value: "AUTO", label: "AUTO" },
                            { value: "CONCISE", label: "CONCISE" },
                            { value: "DETAILED", label: "DETAILED" },
                        ]}
                        clearable
                        value={form.values.overrideOptions.summary || null}
                        onChange={(value) =>
                            form.setFieldValue("overrideOptions.summary", value ?? "")
                        }
                    />
                    <Group justify="flex-end">
                        <Button onClick={() => setOptionsModalOpen(false)}>확인</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={confirmPromptChangeOpen}
                onClose={() => setConfirmPromptChangeOpen(false)}
                title="프롬프트 변경"
            >
                <Stack>
                    <Text>
                        입력된 내용이 사라지고 선택하신 프롬프트의 내용으로 변경됩니다. 계속
                        하시겠습니까?
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setConfirmPromptChangeOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={() => {
                                const target = promptChangeRef.current;
                                setConfirmPromptChangeOpen(false);
                                if (target) {
                                    handleSelectPrompt(target.id);
                                }
                                promptChangeRef.current = null;
                            }}
                        >
                            계속
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={createPromptOpen}
                onClose={() => setCreatePromptOpen(false)}
                title="새 프롬프트 생성"
                size="lg"
            >
                <Stack>
                    <TextInput label="프롬프트 이름" required {...promptForm.getInputProps("name")} />
                    <TextInput label="설명" {...promptForm.getInputProps("description")} />
                    <TextInput label="메인 브랜치 이름" {...promptForm.getInputProps("mainRefName")} />
                    <Group justify="flex-end">
                        <Button
                            type="button"
                            onClick={async () => {
                                const result = promptForm.validate();
                                if (result.hasErrors) return;
                                try {
                                    setPromptSubmitLocked(true);
                                    const values = promptForm.values;
                                    const created = await createPrompt(workspaceId, {
                                        name: values.name.trim(),
                                        description: values.description.trim() || undefined,
                                        instructions: form.values.instructions,
                                        mainRefName: values.mainRefName.trim() || "main",
                                        additionalInputs: form.values.inputItems.map((item, index) => ({
                                            position: index + 1,
                                            role: item.role,
                                            message: item.message,
                                        })),
                                    });
                                    setCreatePromptOpen(false);
                                    await queryClient.invalidateQueries({
                                        queryKey: queryKeys.prompts(workspaceId),
                                    });
                                    handleSelectPrompt(created.id);
                                    if (created.defaultBranchRefId) {
                                        onRefChange?.(String(created.defaultBranchRefId));
                                    }
                                    showNotification({
                                        color: "teal",
                                        title: "생성 완료",
                                        message: "프롬프트가 생성되었습니다.",
                                    });
                                } catch {
                                    // notifications handled by apiFetch
                                } finally {
                                    setPromptSubmitLocked(false);
                                }
                            }}
                            loading={promptSubmitLocked}
                        >
                            생성
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={!!createRefOpen}
                onClose={() => setCreateRefOpen(null)}
                title={createRefOpen?.type === "TAG" ? "새 Tag 생성" : "새 Branch 생성"}
                size="lg"
            >
                <Stack>
                    <TextInput label="이름" required {...refForm.getInputProps("name")} />
                    <TextInput label="설명" {...refForm.getInputProps("description")} />
                    <Group justify="flex-end">
                        <Button
                            type="button"
                            onClick={async () => {
                                const result = refForm.validate();
                                if (result.hasErrors) return;
                                if (!form.values.promptId || !form.values.refId || !createRefOpen) {
                                    return;
                                }
                                try {
                                    const values = refForm.values;
                                    const ref = await createRef(form.values.promptId, {
                                        name: values.name.trim(),
                                        description: values.description.trim() || undefined,
                                        type: createRefOpen.type,
                                        fromRefId: Number(form.values.refId),
                                    });

                                    if (createRefOpen.type === "BRANCH" && isModified) {
                                        await updateRef(form.values.promptId, ref.id, {
                                            instructions: form.values.instructions,
                                            description: values.description.trim() || undefined,
                                        });
                                        await syncAdditionalInputs(form.values.promptId, ref.id);
                                    }

                                    setCreateRefOpen(null);
                                    await queryClient.invalidateQueries({
                                        queryKey: queryKeys.refs(form.values.promptId),
                                    });
                                    onRefChange?.(String(ref.id));
                                    showNotification({
                                        color: "teal",
                                        title: "생성 완료",
                                        message: `${createRefOpen.type}가 생성되었습니다.`,
                                    });
                                } catch (error) {
                                    if (error && typeof error === "object" && "status" in error) {
                                        return;
                                    }
                                    showNotification({
                                        color: "red",
                                        title: "오류",
                                        message: "생성 중 문제가 발생했습니다.",
                                    });
                                }
                            }}
                        >
                            생성
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </form>
    );
}
