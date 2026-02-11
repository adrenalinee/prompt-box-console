"use client";

import React from "react";
import {
    ActionIcon,
    Alert,
    Button,
    Collapse,
    Group,
    Menu,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
    IconChevronDown,
    IconChevronRight,
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
import { ModelSelector } from "../ModelSelector";
import { PromptSelector } from "../PromptSelector";
import { useExecuteForm } from "../useExecuteForm";
import type { ExecuteFormValues, InputItemForm } from "../types";

type ExecutePanelProps = {
    initialOverrideInstructions?: string;
    initialInputItems?: InputItemForm[];
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

    // Additional props for Compare Mode
    onRemoveColumn?: () => void;
    onValuesChange?: (values: ExecuteFormValues) => void;
};

export type CompactExecutePanelRef = {
    execute: () => void;
    setInstructions: (value: string) => void;
    setInputItems: (items: InputItemForm[]) => void;
    getValues: () => ExecuteFormValues;
};

export const CompactExecutePanel = React.forwardRef<CompactExecutePanelRef, ExecutePanelProps>(({
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
    initialOverrideInstructions,
    initialInputItems,
    onRemoveColumn,
    onValuesChange,
}, ref) => {
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

    // Collapsible states
    const [instructionsOpen, { toggle: toggleInstructions }] = useDisclosure(true);
    const [inputItemsOpen, { toggle: toggleInputItems }] = useDisclosure(true);

    const {
        form,
        normalizeInputItems,
        updateInputMessage,
        effectiveInputItems,
        hasPromptContent,
        isModified,
        hasInvalidInputItems,
        refBaselineInstructions,
        refBaselineInputs,
        setRefBaselineInstructions,
        setRefBaselineInputs,
    } = useExecuteForm({
        initialPromptId: selectedPromptId,
        initialRefId: selectedRefId,
        initialModelId: selectedModelId,
        initialApiKeyId: selectedApiKeyId,
        initialOverrideInstructions,
        initialInputItems,
        refs,
        defaultOptions,
        additionalInputs,
        onValuesChange,
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

    const handleSubmit = (values: ExecuteFormValues) => {
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
            instructions: useRef ? undefined : values.instructions,
            modelId: values.modelId,
            apiKeyId: values.apiKeyId,
            inputItems: effectiveItems,
            overrideOptions: hasOptions ? options : undefined,
        });
    };

    React.useImperativeHandle(ref, () => ({
        execute: () => {
            const validation = form.validate();
            if (!validation.hasErrors) {
                handleSubmit(form.values);
            }
        },
        setInstructions: (value: string) => form.setFieldValue("instructions", value),
        setInputItems: (items: InputItemForm[]) => form.setFieldValue("inputItems", items),
        getValues: () => form.values,
    }));

    const optionSummary = [
        { label: "temperature", value: form.values.overrideOptions.temperature ?? "-" },
        { label: "topP", value: form.values.overrideOptions.topP ?? "-" },
        { label: "maxTokens", value: form.values.overrideOptions.maxTokens ?? "-" },
        { label: "textFormat", value: form.values.overrideOptions.textFormat || "-" },
        { label: "effort", value: form.values.overrideOptions.effort || "-" },
        { label: "verbosity", value: form.values.overrideOptions.verbosity || "-" },
        { label: "summary", value: form.values.overrideOptions.summary || "-" },
    ];

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
            if (refBaselineInputs.length > 0) {
                form.setFieldValue("inputItems", normalizeInputItems(refBaselineInputs));
            } else {
                form.setFieldValue("inputItems", [{ role: "USER", message: "" }]);
            }
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
                onSubmit={form.onSubmit(handleSubmit)}
            >
                <Stack gap="sm">
                    {/* 1. Model Selector & Actions */}
                    <Group align="flex-start">
                        <div style={{ flex: 1 }}>
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
                        </div>
                        {onRemoveColumn && (
                            <ActionIcon
                                color="red"
                                variant="light"
                                onClick={onRemoveColumn}
                                mt={2} // alignment adjustment
                            >
                                <IconDotsVertical size={16} /> {/* Should probably be X or Trash? Using X for now if available, or just keeping simpler */}
                                {/* Actually IconX is better */}
                            </ActionIcon>
                        )}
                    </Group>

                    <Group justify="space-between" align="flex-start" style={{ flexWrap: "nowrap" }}>
                        <Text size="xs" style={{ flex: 1, lineHeight: 1.4 }} lineClamp={1}>
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
                            // Same logic as ExecutePanel (omitted for brevity, copied below)
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

                                setRefBaselineInstructions(form.values.instructions);
                                setRefBaselineInputs(normalizeInputItems(form.values.inputItems));

                                try {
                                    const key = `playground_override_${form.values.promptId}_${form.values.refId}`;
                                    sessionStorage.removeItem(key);
                                } catch (e) { }

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

                    {/* 3. Instructions (Collapsible) */}
                    <Stack gap="xs">
                        <UnstyledButton onClick={toggleInstructions}>
                            <Group gap={4}>
                                {instructionsOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                                <Text fw={600} size="sm">Instructions</Text>
                            </Group>
                        </UnstyledButton>
                        <Collapse in={instructionsOpen}>
                            <Textarea
                                minRows={3}
                                maxRows={10}
                                autosize
                                placeholder="Instructions..."
                                {...form.getInputProps("instructions")}
                            />
                        </Collapse>
                    </Stack>

                    {/* 4. Input Items (Collapsible) */}
                    <Stack gap={4}>
                        <UnstyledButton onClick={toggleInputItems}>
                            <Group gap={4}>
                                {inputItemsOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                                <Text fw={600} size="sm">Input Items</Text>
                            </Group>
                        </UnstyledButton>
                        <Collapse in={inputItemsOpen}>
                            <Stack gap="xs">
                                {hasInvalidInputItems && (
                                    <Alert color="yellow" variant="light" py="xs">
                                        message가 비어 있으면 안됩니다.
                                    </Alert>
                                )}
                                {form.values.inputItems.map((item, index) => (
                                    <Paper key={`input-${index}`} withBorder p="xs">
                                        <Group justify="space-between" align="center" mb="xs">
                                            <Select
                                                size="xs"
                                                data={[
                                                    { value: "USER", label: "USER" },
                                                    { value: "ASSISTANT", label: "ASSISTANT" },
                                                    { value: "SYSTEM", label: "SYSTEM" },
                                                    { value: "DEVELOPER", label: "DEVELOPER" },
                                                ]}
                                                w={110}
                                                {...form.getInputProps(`inputItems.${index}.role`)}
                                            />
                                            <Menu shadow="md" position="bottom-end">
                                                <Menu.Target>
                                                    <ActionIcon variant="light" type="button" size="sm">
                                                        <IconDotsVertical size={14} />
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
                                            minRows={2}
                                            autosize
                                            size="sm"
                                            value={item.message}
                                            onChange={(event) =>
                                                updateInputMessage(index, event.currentTarget.value)
                                            }
                                        />
                                    </Paper>
                                ))}
                            </Stack>
                        </Collapse>
                    </Stack>
                </Stack>
            </form>

            {/* Reuse Modals - Simplified for brevity, need full copy if they differ */}
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
                            queryClient.invalidateQueries({
                                queryKey: queryKeys.prompts(workspaceId),
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
                            form.setFieldValue("refId", String(result.id));
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
        </>
    );
});
