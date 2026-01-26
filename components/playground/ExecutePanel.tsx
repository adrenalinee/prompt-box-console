"use client";

import React from "react";
import {
    ActionIcon,
    Button,
    Group,
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
import { IconAdjustments, IconSearch } from "@tabler/icons-react";
import type { AdditionalInputItem, Prompt, PromptRef } from "@/lib/api/prompts";
import type { ApiKey, Model, Vendor } from "@/lib/api/settings";
import type { DefaultOptions } from "@/lib/api/workspaces";

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
    prompts: Prompt[];
    selectedPromptId: string;
    onPromptChange?: (promptId: string) => void;
    refs: PromptRef[];
    selectedRefId: string;
    onRefChange?: (refId: string) => void;
    models: Model[];
    apiKeys: ApiKey[];
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
    prompts,
    selectedPromptId,
    onPromptChange,
    refs,
    selectedRefId,
    onRefChange,
    models,
    apiKeys,
    vendors,
    vendorId,
    onVendorChange,
    defaultOptions,
    additionalInputs,
    onExecute,
}: ExecutePanelProps) {
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

    const form = useForm<ExecuteFormValues>({
        initialValues: {
            promptId: selectedPromptId ?? "",
            refId: selectedRefId ?? "",
            instructions: "",
            modelId: models[0] ? String(models[0].id) : "",
            apiKeyId: apiKeys[0]?.id ?? "",
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

    React.useEffect(() => {
        form.setFieldValue("promptId", selectedPromptId ?? "");
    }, [selectedPromptId]);

    React.useEffect(() => {
        form.setFieldValue("refId", selectedRefId ?? "");
    }, [selectedRefId]);

    const selectedRef = safeRefs.find((ref) => String(ref.id) === form.values.refId);

    React.useEffect(() => {
        if (!selectedRef) {
            if (!form.values.promptId) {
                setRefBaselineInstructions("");
                form.setFieldValue("instructions", "");
            }
            return;
        }
        setRefBaselineInstructions(selectedRef.instructions ?? "");
        form.setFieldValue("instructions", selectedRef.instructions ?? "");
    }, [selectedRef?.id, selectedRef?.instructions]);

    React.useEffect(() => {
        if (!selectedRefId) return;
        if (additionalInputs && additionalInputs.length > 0) {
            form.setFieldValue(
                "inputItems",
                additionalInputs.map((item) => ({
                    role: item.role,
                    message: item.message,
                })),
            );
        } else {
            form.setFieldValue("inputItems", [{ role: "USER", message: "" }]);
        }
    }, [selectedRefId, additionalInputs]);

    React.useEffect(() => {
        if (!models.length) {
            form.setFieldValue("modelId", "");
            return;
        }
        if (!models.find((model) => String(model.id) === form.values.modelId)) {
            form.setFieldValue("modelId", String(models[0].id));
        }
    }, [models]);

    const selectedModel = models.find((model) => String(model.id) === form.values.modelId);

    React.useEffect(() => {
        if (!selectedModel) return;
        const vendorKeys = apiKeys.filter((key) => key.vendorId === selectedModel.vendorId);
        if (vendorKeys.length === 0) {
            form.setFieldValue("apiKeyId", "");
            return;
        }
        if (!vendorKeys.find((key) => key.id === form.values.apiKeyId)) {
            form.setFieldValue("apiKeyId", vendorKeys[0].id);
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
        { label: "온도", value: form.values.overrideOptions.temperature ?? "-" },
        { label: "Top P", value: form.values.overrideOptions.topP ?? "-" },
        { label: "최대 토큰", value: form.values.overrideOptions.maxTokens ?? "-" },
        { label: "텍스트 포맷", value: form.values.overrideOptions.textFormat || "-" },
        { label: "노력도", value: form.values.overrideOptions.effort || "-" },
        { label: "말의 길이", value: form.values.overrideOptions.verbosity || "-" },
        { label: "요약", value: form.values.overrideOptions.summary || "-" },
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
                    <Text fw={700} size="xl">
                        Playground
                    </Text>
                    <Group gap="xs">
                        <Button variant="default" onClick={() => setPromptModalOpen(true)}>
                            {promptLabel}
                        </Button>
                        <Button
                            variant="default"
                            disabled={!form.values.promptId}
                            onClick={() => setRefModalOpen(true)}
                        >
                            {refLabel}
                        </Button>
                    </Group>
                </Group>

                <Group justify="space-between" align="center">
                    <Button variant="default" onClick={() => setModelModalOpen(true)}>
                        모델 선택
                    </Button>
                    <Text size="sm">
                        <Text span c="dimmed">
                            벤더
                        </Text>
                        <Text span> {selectedVendorName}</Text>
                        {" · "}
                        <Text span c="dimmed">
                            모델
                        </Text>
                        <Text span> {selectedModel?.name ?? "-"}</Text>
                        {" · "}
                        <Text span c="dimmed">
                            API Key
                        </Text>
                        <Text span> {apiKeyLabel}</Text>
                    </Text>
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
                    <ActionIcon variant="light" onClick={() => setOptionsModalOpen(true)}>
                        <IconAdjustments size={16} />
                    </ActionIcon>
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
                                <Button
                                    variant="subtle"
                                    color="red"
                                    size="xs"
                                    onClick={() => form.removeListItem("inputItems", index)}
                                    disabled={form.values.inputItems.length === 1}
                                >
                                    삭제
                                </Button>
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
                                            <Button
                                                size="xs"
                                                onClick={() => {
                                                    form.setFieldValue("promptId", prompt.id);
                                                    form.setFieldValue("refId", "");
                                                    setPromptModalOpen(false);
                                                    onPromptChange?.(prompt.id);
                                                }}
                                            >
                                                선택
                                            </Button>
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
                                form.setFieldValue("promptId", "");
                                form.setFieldValue("refId", "");
                                setPromptModalOpen(false);
                                onPromptChange?.("");
                                onRefChange?.("");
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
                        onChange={(value) =>
                            form.setFieldValue("apiKeyId", value ?? "")
                        }
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
                                                <Button
                                                    size="xs"
                                                    disabled={!hasApiKey}
                                                    onClick={() => {
                                                        form.setFieldValue(
                                                            "modelId",
                                                            String(model.id),
                                                        );
                                                        if (!apiKeyOptions.find((key) => key.value === form.values.apiKeyId)) {
                                                            const nextKey = apiKeys.find(
                                                                (key) =>
                                                                    key.vendorId === model.vendorId,
                                                            );
                                                            form.setFieldValue(
                                                                "apiKeyId",
                                                                nextKey?.id ?? "",
                                                            );
                                                        }
                                                        setModelModalOpen(false);
                                                    }}
                                                >
                                                    선택
                                                </Button>
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
                            label="온도"
                            description="기본값: workspace defaultOptions"
                            decimalScale={2}
                            min={0}
                            {...form.getInputProps("overrideOptions.temperature")}
                        />
                        <NumberInput
                            label="Top P"
                            description="0~1 범위의 샘플링 확률"
                            min={0}
                            {...form.getInputProps("overrideOptions.topP")}
                        />
                        <NumberInput
                            label="최대 토큰"
                            description="최대 출력 토큰 수"
                            min={0}
                            {...form.getInputProps("overrideOptions.maxTokens")}
                        />
                    </Group>
                    <Group grow>
                        <TextInput
                            label="텍스트 포맷"
                            description="예: markdown, plain"
                            {...form.getInputProps("overrideOptions.textFormat")}
                        />
                        <Select
                            label="노력도"
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
                            label="말의 길이"
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
                        label="요약"
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
        </form>
    );
}
