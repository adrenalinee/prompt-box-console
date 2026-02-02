"use client";

import React from "react";
import {
    ActionIcon,
    Alert,
    Button,
    Group,
    Menu,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconAdjustments,
    IconDotsVertical,
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
import { ModelSelector } from "./ModelSelector";
import { PromptSelector } from "./PromptSelector";

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
    initialOverrideInstructions?: string; // Added prop
    workspaceId: string;
    prompts: Prompt[];
    promptsError?: unknown;
    selectedPromptId: string;
    onPromptChange?: (promptId: string) => void;
    refs: PromptRef[];
    refsError?: unknown;
    selectedRefId: string;
    onRefChange?: (refId: string) => void;
    models: Model[];
    modelsError?: unknown;
    selectedModelId?: string;
    onModelChange?: (modelId: string) => void;
    apiKeys: ApiKey[];
    apiKeysError?: unknown;
    selectedApiKeyId?: string;
    onApiKeyChange?: (apiKeyId: string) => void;
    vendors: Vendor[];
    vendorsError?: unknown;
    vendorId?: string;
    onVendorChange?: (vendorId: string | null) => void;
    defaultOptions?: DefaultOptions | null;
    additionalInputs?: AdditionalInputItem[];
    workspaceDefaultModelId?: number;

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
    promptsError,
    selectedPromptId,
    onPromptChange,
    refs,
    refsError,
    selectedRefId,
    onRefChange,
    models,
    modelsError,
    selectedModelId,
    onModelChange,
    apiKeys,
    apiKeysError,
    selectedApiKeyId,
    onApiKeyChange,
    vendors,
    vendorsError,
    vendorId,
    onVendorChange,
    defaultOptions,
    additionalInputs,
    workspaceDefaultModelId,
    onExecute,
    initialOverrideInstructions, // Added destructuring
}: ExecutePanelProps) {
    const queryClient = useQueryClient();
    const promptChangeRef = React.useRef<{ id: string; name?: string } | null>(null);
    const [confirmPromptChangeOpen, setConfirmPromptChangeOpen] = React.useState(false);
    const [createPromptOpen, setCreatePromptOpen] = React.useState(false);
    const [createRefOpen, setCreateRefOpen] = React.useState<{
        type: "TAG" | "BRANCH";
    } | null>(null);
    const [missingModelOpen, setMissingModelOpen] = React.useState(false);
    const [missingInputOpen, setMissingInputOpen] = React.useState(false);
    const [optionsModalOpen, setOptionsModalOpen] = React.useState(false);
    const [refBaselineInstructions, setRefBaselineInstructions] = React.useState("");
    const [refBaselineInputs, setRefBaselineInputs] = React.useState<InputItemForm[]>([]);

    // Track override consumption
    const overrideConsumedRef = React.useRef(false);
    const lastRefIdRef = React.useRef<string | null>(null);

    const form = useForm<ExecuteFormValues>({
        initialValues: {
            promptId: selectedPromptId ?? "",
            refId: selectedRefId ?? "",
            instructions: "",
            modelId: selectedModelId ?? "",
            apiKeyId: selectedApiKeyId ?? "",
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

    const normalizeInputItems = React.useCallback((items: InputItemForm[]) => {
        let next = items.map((item) => ({ ...item }));
        if (next.length === 0) {
            next = [{ role: "USER", message: "" }];
        }
        while (next.length > 1) {
            const last = next[next.length - 1];
            const prev = next[next.length - 2];
            if (last.message.trim() === "" && prev.message.trim() === "") {
                next.pop();
            } else {
                break;
            }
        }
        const last = next[next.length - 1];
        if (last.message.trim() !== "") {
            next.push({ role: "USER", message: "" });
        }
        return next;
    }, []);

    const updateInputMessage = React.useCallback(
        (index: number, value: string) => {
            const items = form.values.inputItems.map((item, idx) =>
                idx === index ? { ...item, message: value } : item,
            );
            if (index === items.length - 1 && value.trim().length > 0) {
                items.push({ role: "USER", message: "" });
            }
            if (index === items.length - 2 && value.trim().length === 0) {
                items.splice(index, 1);
            }
            form.setFieldValue("inputItems", normalizeInputItems(items));
        },
        [form, normalizeInputItems],
    );

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

    // Sync external props to form state
    // IMPORTANT: Dependencies are critical here. We only want to update if valid props change.
    React.useEffect(() => {
        if (selectedPromptId !== undefined) form.setFieldValue("promptId", selectedPromptId);
    }, [selectedPromptId]);

    React.useEffect(() => {
        if (selectedRefId !== undefined) form.setFieldValue("refId", selectedRefId);
    }, [selectedRefId]);

    React.useEffect(() => {
        if (selectedModelId !== undefined) form.setFieldValue("modelId", selectedModelId);
    }, [selectedModelId]);

    React.useEffect(() => {
        if (selectedApiKeyId !== undefined) form.setFieldValue("apiKeyId", selectedApiKeyId);
    }, [selectedApiKeyId]);


    const safeRefs = Array.isArray(refs) ? refs : [];
    const selectedRef = safeRefs.find((ref) => String(ref.id) === form.values.refId);

    // Sync instructions when Ref changes
    React.useEffect(() => {
        if (!selectedRef) {
            if (!form.values.promptId) {
                setRefBaselineInstructions("");
                form.setFieldValue("instructions", "");
                setRefBaselineInputs([]);
                lastRefIdRef.current = null;
            }
            return;
        }

        const serverInstructions = selectedRef.instructions ?? "";
        const currentRefId = String(selectedRef.id);
        const refChanged = lastRefIdRef.current !== currentRefId;

        // Apply override if available and not yet consumed
        if (initialOverrideInstructions !== undefined && !overrideConsumedRef.current) {
            form.setFieldValue("instructions", initialOverrideInstructions);
            setRefBaselineInstructions(serverInstructions);
            overrideConsumedRef.current = true;
            lastRefIdRef.current = currentRefId;
            return;
        }

        // Standard Sync Logic
        // If Ref changed, always update.
        if (refChanged) {
            form.setFieldValue("instructions", serverInstructions);
        } else {
            // Ref updated (same ID). Only update if user hasn't modified it (dirty check).
            // Using loose equality for safety, or strict.
            if (form.values.instructions === refBaselineInstructions) {
                form.setFieldValue("instructions", serverInstructions);
            }
        }

        setRefBaselineInstructions(serverInstructions);
        lastRefIdRef.current = currentRefId;
    }, [selectedRef?.id, selectedRef?.instructions, initialOverrideInstructions]);

    // Sync additional Inputs when Ref changes
    React.useEffect(() => {
        if (!selectedRefId) return;
        if (additionalInputs && additionalInputs.length > 0) {
            const nextItems: InputItemForm[] = additionalInputs.map((item) => ({
                role: item.role as InputItemForm["role"],
                message: item.message,
            }));
            form.setFieldValue("inputItems", normalizeInputItems(nextItems));
            setRefBaselineInputs(nextItems);
        } else {
            const defaultItems: InputItemForm[] = [{ role: "USER", message: "" }];
            form.setFieldValue("inputItems", normalizeInputItems(defaultItems));
            setRefBaselineInputs([]);
        }
    }, [selectedRefId, additionalInputs, normalizeInputItems]);

    // Input normalization effect
    React.useEffect(() => {
        const normalized = normalizeInputItems(form.values.inputItems);
        const current = form.values.inputItems;
        const isSame =
            normalized.length === current.length &&
            normalized.every(
                (item, index) =>
                    item.message === current[index]?.message &&
                    item.role === current[index]?.role,
            );
        if (!isSame) {
            form.setFieldValue("inputItems", normalized);
        }
    }, [form.values.inputItems, normalizeInputItems, form]);

    // Default Options logic
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


    const optionSummary = [
        { label: "temperature", value: form.values.overrideOptions.temperature ?? "-" },
        { label: "topP", value: form.values.overrideOptions.topP ?? "-" },
        { label: "maxTokens", value: form.values.overrideOptions.maxTokens ?? "-" },
        { label: "textFormat", value: form.values.overrideOptions.textFormat || "-" },
        { label: "effort", value: form.values.overrideOptions.effort || "-" },
        { label: "verbosity", value: form.values.overrideOptions.verbosity || "-" },
        { label: "summary", value: form.values.overrideOptions.summary || "-" },
    ];


    const effectiveInputItems = React.useMemo(
        () => form.values.inputItems.filter((item) => item.message.trim().length > 0),
        [form.values.inputItems],
    );
    const hasPromptContent =
        form.values.instructions.trim().length > 0 || effectiveInputItems.length > 0;

    // Calculate effective baseline inputs (remove empty items) for comparison
    const effectiveBaselineInputs = React.useMemo(
        () => refBaselineInputs.filter((item) => item.message.trim().length > 0),
        [refBaselineInputs]
    );

    const isModified =
        !!form.values.promptId &&
        !!form.values.refId &&
        (form.values.instructions.trim() !== refBaselineInstructions.trim() ||
            JSON.stringify(effectiveInputItems) !== JSON.stringify(effectiveBaselineInputs));

    const hasInvalidInputItems = form.values.inputItems
        .slice(0, -1)
        .some((item) => item.message.trim().length === 0);


    // Action Handlers
    const syncAdditionalInputs = async (promptId: string, refId: number) => {
        const existing = additionalInputs ?? [];
        const next = effectiveInputItems.map((item, index) => ({
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
        onPromptChange?.(promptId);
        onRefChange?.("");
    };

    const requestPromptChange = (promptId: string, name?: string) => {
        if (isModified && promptId !== form.values.promptId) {
            promptChangeRef.current = { id: promptId, name };
            setConfirmPromptChangeOpen(true);
            return;
        }
        handleSelectPrompt(promptId);
    };


    const handleReset = () => {
        if (window.confirm("초기 상태로 되돌리시겠습니까? 저장하지 않은 내용은 사라집니다.")) {
            form.setFieldValue("instructions", refBaselineInstructions);
            // Also reset inputs to baseline
            if (refBaselineInputs.length > 0) {
                form.setFieldValue("inputItems", normalizeInputItems(refBaselineInputs));
            } else {
                form.setFieldValue("inputItems", [{ role: "USER", message: "" }]);
            }

            // Clear session storage override
            try {
                if (form.values.promptId && form.values.refId) {
                    const key = `playground_override_${form.values.promptId}_${form.values.refId}`;
                    sessionStorage.removeItem(key);
                }
            } catch (e) { }
        }
    };

    return (
        <>
            <form
                id="playground-execute-form"
                onSubmit={form.onSubmit((values) => {
                    if (!values.modelId || !values.apiKeyId) {
                        setMissingModelOpen(true);
                        return;
                    }
                    const effectiveItems = values.inputItems.filter(
                        (item) => item.message.trim().length > 0,
                    );
                    const hasAnyInput =
                        values.instructions.trim().length > 0 || effectiveItems.length > 0;
                    if (!hasAnyInput) {
                        setMissingInputOpen(true);
                        return;
                    }
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
                        inputItems: effectiveItems,
                        overrideOptions: hasOptions ? options : undefined,
                    });
                })}
            >
                <Stack>
                    {/* 1. Model Selector */}
                    <ModelSelector
                        models={models}
                        modelsError={modelsError}
                        selectedModelId={form.values.modelId}
                        onModelChange={(id) => {
                            form.setFieldValue("modelId", id);
                            onModelChange?.(id);
                        }}
                        apiKeys={apiKeys}
                        apiKeysError={apiKeysError}
                        selectedApiKeyId={form.values.apiKeyId}
                        onApiKeyChange={(id) => {
                            form.setFieldValue("apiKeyId", id);
                            onApiKeyChange?.(id);
                        }}
                        vendors={vendors}
                        vendorsError={vendorsError}
                        vendorId={vendorId}
                        onVendorChange={onVendorChange}
                        workspaceDefaultModelId={workspaceDefaultModelId}
                        onOptionsClick={() => setOptionsModalOpen(true)}
                    />

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

                    {/* 2. Prompt Selector */}
                    <PromptSelector
                        prompts={prompts}
                        promptsError={promptsError}
                        selectedPromptId={form.values.promptId}
                        onPromptChange={handleSelectPrompt}
                        refs={refs}
                        refsError={refsError}
                        selectedRefId={form.values.refId}
                        onRefChange={(id) => {
                            form.setFieldValue("refId", id);
                            onRefChange?.(id);
                        }}
                        isModified={isModified}
                        hasPromptContent={hasPromptContent}
                        onCreatePrompt={() => {
                            promptForm.reset();
                            setCreatePromptOpen(true);
                        }}
                        onCreateTag={() => {
                            refForm.reset();
                            setCreateRefOpen({ type: "TAG" });
                        }}
                        onSaveChanges={async () => {
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

                                // Reset dirty state
                                setRefBaselineInstructions(form.values.instructions);
                                setRefBaselineInputs(normalizeInputItems(form.values.inputItems));

                                // Clear session storage override
                                try {
                                    const key = `playground_override_${form.values.promptId}_${form.values.refId}`;
                                    sessionStorage.removeItem(key);
                                } catch (e) { }

                                // Invalidate queries to fetch fresh data
                                queryClient.invalidateQueries({ queryKey: queryKeys.refs(form.values.promptId) });
                                queryClient.invalidateQueries({ queryKey: queryKeys.prompt(form.values.promptId) });
                                queryClient.invalidateQueries({ queryKey: queryKeys.additionalInputs(form.values.promptId, Number(form.values.refId)) });
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
                        onCreateBranch={() => {
                            refForm.reset();
                            setCreateRefOpen({ type: "BRANCH" });
                        }}
                        onRequestPromptChange={requestPromptChange}
                        onReset={handleReset}
                    />

                    <Textarea
                        label="Instructions"
                        minRows={6}
                        autosize
                        {...form.getInputProps("instructions")}
                    />

                    <Stack gap="xs">
                        <Text fw={600}>Input Items</Text>
                        {hasInvalidInputItems && (
                            <Alert color="yellow" variant="light">
                                message가 비어 있으면 안됩니다. 필요없는 input item이라면 삭제해주세요.
                            </Alert>
                        )}
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
                                            <ActionIcon variant="light" type="button">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item
                                                color="red"
                                                disabled={form.values.inputItems.length === 1}
                                                onClick={() => form.removeListItem("inputItems", index)}
                                                component="button"
                                                type="button"
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
                                    value={item.message}
                                    onChange={(event) =>
                                        updateInputMessage(index, event.currentTarget.value)
                                    }
                                />
                            </Paper>
                        ))}
                    </Stack>
                </Stack>
            </form>

            {/* Other Modals (Create Prompt, etc) remain here mostly unchanged as they are specific to ExecutePanel actions */}
            <Modal
                opened={confirmPromptChangeOpen}
                onClose={() => setConfirmPromptChangeOpen(false)}
                title="변경 사항 확인"
            >
                <Stack>
                    <Text>
                        현재 작업 중인 내용이 저장되지 않았습니다. 다른 프롬프트로 이동하시겠습니까?
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setConfirmPromptChangeOpen(false)}>
                            취소
                        </Button>
                        <Button
                            color="red"
                            onClick={() => {
                                if (promptChangeRef.current) {
                                    handleSelectPrompt(promptChangeRef.current.id);
                                } else {
                                    // if name is empty, it means unselect
                                    handleSelectPrompt("");
                                }
                                setConfirmPromptChangeOpen(false);
                            }}
                        >
                            이동 (저장하지 않음)
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* ... Other modals for Create Prompt, Create Branch ... */}
            <Modal
                opened={createPromptOpen}
                onClose={() => setCreatePromptOpen(false)}
                title="새 프롬프트 생성"
            >
                <form
                    onSubmit={promptForm.onSubmit(async (values) => {
                        try {
                            const result = await createPrompt(workspaceId, {
                                name: values.name,
                                description: values.description,
                                instructions: form.values.instructions,
                                additionalInputs: effectiveInputItems.map((item, index) => ({
                                    position: index + 1,
                                    role: item.role,
                                    message: item.message,
                                })),
                                mainRefName: values.mainRefName,
                            });
                            showNotification({
                                color: "teal",
                                title: "생성 완료",
                                message: "새 프롬프트가 생성되었습니다.",
                            });
                            setCreatePromptOpen(false);
                            handleSelectPrompt(result.id);
                        } catch {
                            showNotification({
                                color: "red",
                                title: "오류",
                                message: "프롬프트 생성 중 문제가 발생했습니다.",
                            });
                        }
                    })}
                >
                    <Stack>
                        <TextInput
                            label="이름"
                            placeholder="프롬프트 이름"
                            required
                            {...promptForm.getInputProps("name")}
                        />
                        <Textarea
                            label="설명"
                            placeholder="설명 (선택)"
                            {...promptForm.getInputProps("description")}
                        />
                        <TextInput
                            label="Main Branch 이름"
                            {...promptForm.getInputProps("mainRefName")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit">생성</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={createRefOpen !== null}
                onClose={() => setCreateRefOpen(null)}
                title={createRefOpen?.type === "TAG" ? "Tag 생성" : "새 Branch 생성"}
            >
                <form
                    onSubmit={refForm.onSubmit(async (values) => {
                        if (!createRefOpen || !form.values.promptId || !form.values.refId) return;
                        try {
                            const result = await createRef(form.values.promptId, {
                                name: values.name,
                                description: values.description,
                                type: createRefOpen.type,
                                fromRefId: Number(form.values.refId),
                            });
                            if (createRefOpen.type === "BRANCH" && isModified) {
                                // If creating branch from modified state, we must update it immediately
                                await updateRef(form.values.promptId, result.id, {
                                    instructions: form.values.instructions,
                                });
                                await syncAdditionalInputs(form.values.promptId, result.id);
                            }
                            showNotification({
                                color: "teal",
                                title: "생성 완료",
                                message: `${createRefOpen.type}가 생성되었습니다.`,
                            });
                            queryClient.invalidateQueries({
                                queryKey: queryKeys.refs(form.values.promptId),
                            });
                            setCreateRefOpen(null);
                            onRefChange?.(String(result.id));
                            form.setFieldValue("refId", String(result.id)); // Force update local state
                        } catch {
                            showNotification({
                                color: "red",
                                title: "오류",
                                message: "생성 중 문제가 발생했습니다.",
                            });
                        }
                    })}
                >
                    <Stack>
                        <TextInput
                            label="이름"
                            placeholder="이름"
                            required
                            {...refForm.getInputProps("name")}
                        />
                        <Textarea
                            label="설명"
                            placeholder="설명 (선택)"
                            {...refForm.getInputProps("description")}
                        />
                        <Group justify="flex-end">
                            <Button type="submit">생성</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal
                opened={missingModelOpen}
                onClose={() => setMissingModelOpen(false)}
                title="모델 선택 필요"
            >
                <Text>실행하려면 모델과 API Key를 선택해야 합니다.</Text>
                <Group justify="flex-end" mt="md">
                    <Button onClick={() => setMissingModelOpen(false)}>확인</Button>
                </Group>
            </Modal>

            <Modal
                opened={missingInputOpen}
                onClose={() => setMissingInputOpen(false)}
                title="입력 필요"
            >
                <Text>Instructions 또는 Input Item 중 하나는 입력해야 합니다.</Text>
                <Group justify="flex-end" mt="md">
                    <Button onClick={() => setMissingInputOpen(false)}>확인</Button>
                </Group>
            </Modal>

            {/* Options Modal - Reusing the one from before but stripped down as logic is in form */}
            <Modal
                opened={optionsModalOpen}
                onClose={() => setOptionsModalOpen(false)}
                title="Options 설정"
                size="lg"
            >
                <Stack>
                    <Group grow>
                        <TextInput label="Temperature" type="number" step={0.01} {...form.getInputProps("overrideOptions.temperature")} />
                        <TextInput label="Top P" type="number" step={0.01} {...form.getInputProps("overrideOptions.topP")} />
                        <TextInput label="Max Tokens" type="number" {...form.getInputProps("overrideOptions.maxTokens")} />
                    </Group>
                    <Group grow>
                        <TextInput label="textFormat" {...form.getInputProps("overrideOptions.textFormat")} />
                        <Select
                            label="effort"
                            data={[
                                { value: "NONE", label: "NONE" },
                                { value: "MINIMAL", label: "MINIMAL" },
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                                { value: "XHIGH", label: "XHIGH" },
                            ]}
                            clearable
                            value={form.values.overrideOptions.effort || null}
                            onChange={(value) => form.setFieldValue("overrideOptions.effort", value ?? "")}
                        />
                        <Select
                            label="verbosity"
                            data={[
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                            ]}
                            clearable
                            value={form.values.overrideOptions.verbosity || null}
                            onChange={(value) => form.setFieldValue("overrideOptions.verbosity", value ?? "")}
                        />
                    </Group>
                    <Select
                        label="summary"
                        data={[
                            { value: "AUTO", label: "AUTO" },
                            { value: "CONCISE", label: "CONCISE" },
                            { value: "DETAILED", label: "DETAILED" },
                        ]}
                        clearable
                        value={form.values.overrideOptions.summary || null}
                        onChange={(value) => form.setFieldValue("overrideOptions.summary", value ?? "")}
                    />
                    <Group justify="flex-end">
                        <Button onClick={() => setOptionsModalOpen(false)}>닫기</Button>
                    </Group>
                </Stack>
            </Modal>

        </>
    );
}
