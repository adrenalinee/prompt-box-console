"use client";

import React from "react";
import {
    Alert,
    Button,
    Group,
    NumberInput,
    SegmentedControl,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import type { Prompt, PromptRef, Snapshot } from "@/lib/api/prompts";
import type { ApiKey, Model, Vendor } from "@/lib/api/settings";

type InputItemForm = {
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
};

export type ExecuteFormValues = {
    sourceType: "REF" | "SNAPSHOT" | "RAW";
    promptId: string;
    refId: string;
    snapshotId: string;
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
    refs: PromptRef[];
    snapshots: Snapshot[];
    models: Model[];
    apiKeys: ApiKey[];
    vendors: Vendor[];
    vendorId?: string;
    onVendorChange?: (vendorId: string | null) => void;
    initialPromptId?: string;
    initialSnapshotId?: string;
    onPromptChange?: (promptId: string) => void;
    onExecute: (values: {
        sourceType: "REF" | "SNAPSHOT" | "RAW";
        refId?: number;
        snapshotId?: string;
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
    isLoading?: boolean;
};

export function ExecutePanel({
    prompts,
    refs,
    snapshots,
    models,
    apiKeys,
    vendors,
    vendorId,
    onVendorChange,
    initialPromptId,
    initialSnapshotId,
    onPromptChange,
    onExecute,
    isLoading,
}: ExecutePanelProps) {
    const safeRefs = Array.isArray(refs) ? refs : [];
    const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
    const promptOptions = prompts.map((prompt) => ({ value: prompt.id, label: prompt.name }));
    const refOptions = safeRefs.map((ref) => ({
        value: String(ref.id),
        label: `${ref.name} (${ref.type})`,
    }));
    const snapshotOptions = safeSnapshots.map((snapshot) => ({
        value: snapshot.id,
        label: snapshot.version ?? snapshot.id,
    }));
    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${vendorMap.get(model.vendorId) ?? model.vendorId} / ${model.modelKey}`,
    }));
    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const apiKeyOptions = apiKeys.map((key) => ({
        value: key.id,
        label: `${vendorMap.get(key.vendorId) ?? key.vendorId}${key.name ? ` / ${key.name}` : ""}`,
    }));

    const form = useForm<ExecuteFormValues>({
        initialValues: {
            sourceType: "REF",
            promptId: initialPromptId ?? promptOptions[0]?.value ?? "",
            refId: refOptions[0]?.value ?? "",
            snapshotId: initialSnapshotId ?? snapshotOptions[0]?.value ?? "",
            instructions: "",
            modelId: modelOptions[0]?.value ?? "",
            apiKeyId: apiKeyOptions[0]?.value ?? "",
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
        if (initialPromptId) {
            form.setFieldValue("promptId", initialPromptId);
        }
    }, [initialPromptId]);

    React.useEffect(() => {
        if (initialSnapshotId) {
            form.setFieldValue("snapshotId", initialSnapshotId);
            form.setFieldValue("sourceType", "SNAPSHOT");
        }
    }, [initialSnapshotId]);

    React.useEffect(() => {
        if (onPromptChange && form.values.promptId) {
            onPromptChange(form.values.promptId);
        }
    }, [form.values.promptId, onPromptChange]);

    React.useEffect(() => {
        if (refOptions.length && !refOptions.find((opt) => opt.value === form.values.refId)) {
            form.setFieldValue("refId", refOptions[0].value);
        }
        if (
            snapshotOptions.length &&
            !snapshotOptions.find((opt) => opt.value === form.values.snapshotId)
        ) {
            form.setFieldValue("snapshotId", snapshotOptions[0].value);
        }
        if (
            modelOptions.length &&
            !modelOptions.find((opt) => opt.value === form.values.modelId)
        ) {
            form.setFieldValue("modelId", modelOptions[0].value);
        }
        if (
            apiKeyOptions.length &&
            !apiKeyOptions.find((opt) => opt.value === form.values.apiKeyId)
        ) {
            form.setFieldValue("apiKeyId", apiKeyOptions[0].value);
        }
    }, [safeRefs, safeSnapshots, modelOptions, apiKeyOptions]);

    const selectedModel = models.find((model) => String(model.id) === form.values.modelId);
    const selectedKey = apiKeys.find((key) => key.id === form.values.apiKeyId);
    const vendorMismatch =
        selectedModel && selectedKey ? selectedModel.vendorId !== selectedKey.vendorId : false;

    return (
        <form
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
                const hasOptions = Object.values(options).some(
                    (value) => value !== undefined,
                );

                onExecute({
                    sourceType: values.sourceType,
                    refId: values.refId ? Number(values.refId) : undefined,
                    snapshotId: values.snapshotId || undefined,
                    instructions: values.instructions || undefined,
                    modelId: values.modelId,
                    apiKeyId: values.apiKeyId,
                    inputItems: values.inputItems,
                    overrideOptions: hasOptions ? options : undefined,
                });
            })}
        >
            <Stack>
                <SegmentedControl
                    data={[
                        { value: "REF", label: "REF" },
                        { value: "SNAPSHOT", label: "SNAPSHOT" },
                        { value: "RAW", label: "RAW" },
                    ]}
                    {...form.getInputProps("sourceType")}
                />

                <Select
                    label="Prompt"
                    data={promptOptions}
                    placeholder="Prompt 선택"
                    {...form.getInputProps("promptId")}
                />

                {form.values.sourceType === "REF" && (
                    <Select
                        label="Ref"
                        data={refOptions}
                        placeholder="Ref 선택"
                        {...form.getInputProps("refId")}
                    />
                )}

                {form.values.sourceType === "SNAPSHOT" && (
                    <Select
                        label="Snapshot"
                        data={snapshotOptions}
                        placeholder="Snapshot 선택"
                        {...form.getInputProps("snapshotId")}
                    />
                )}

                {form.values.sourceType === "RAW" && (
                    <Textarea
                        label="Raw Instructions"
                        minRows={8}
                        autosize
                        {...form.getInputProps("instructions")}
                    />
                )}

                <Select
                    label="Vendor"
                    data={vendorOptions}
                    placeholder="Vendor 선택"
                    value={vendorId ?? null}
                    onChange={onVendorChange}
                    clearable
                />

                <Select
                    label="Model"
                    data={modelOptions}
                    placeholder="모델 선택"
                    {...form.getInputProps("modelId")}
                />

                <Select
                    label="API Key"
                    data={apiKeyOptions}
                    placeholder="API 키 선택"
                    {...form.getInputProps("apiKeyId")}
                />

                {vendorMismatch && (
                    <Alert title="Vendor 불일치" color="yellow">
                        모델 vendor와 API Key vendor가 다릅니다. 실행 시 오류가 발생할 수 있습니다.
                    </Alert>
                )}

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
                        <Group key={`input-${index}`} align="flex-start">
                            <Select
                                label="Role"
                                data={[
                                    { value: "USER", label: "USER" },
                                    { value: "ASSISTANT", label: "ASSISTANT" },
                                    { value: "SYSTEM", label: "SYSTEM" },
                                    { value: "DEVELOPER", label: "DEVELOPER" },
                                ]}
                                w={150}
                                {...form.getInputProps(`inputItems.${index}.role`)}
                            />
                            <Textarea
                                label="Message"
                                minRows={2}
                                className="flex-1"
                                {...form.getInputProps(`inputItems.${index}.message`)}
                            />
                            <Button
                                mt={24}
                                variant="subtle"
                                color="red"
                                onClick={() => form.removeListItem("inputItems", index)}
                                disabled={form.values.inputItems.length === 1}
                            >
                                삭제
                            </Button>
                        </Group>
                    ))}
                </Stack>

                <Stack gap="xs">
                    <Text fw={600}>Override Options</Text>
                    <Group grow>
                        <TextInput
                            label="Text Format"
                            placeholder="예: markdown"
                            {...form.getInputProps("overrideOptions.textFormat")}
                        />
                        <TextInput
                            label="Effort"
                            placeholder="예: low"
                            {...form.getInputProps("overrideOptions.effort")}
                        />
                        <TextInput
                            label="Verbosity"
                            placeholder="예: low"
                            {...form.getInputProps("overrideOptions.verbosity")}
                        />
                    </Group>
                    <Group grow>
                        <TextInput
                            label="Summary"
                            placeholder="예: short"
                            {...form.getInputProps("overrideOptions.summary")}
                        />
                        <NumberInput
                            label="Temperature"
                            decimalScale={2}
                            min={0}
                            {...form.getInputProps("overrideOptions.temperature")}
                        />
                        <NumberInput
                            label="Top P"
                            min={0}
                            {...form.getInputProps("overrideOptions.topP")}
                        />
                        <NumberInput
                            label="Max Tokens"
                            min={0}
                            {...form.getInputProps("overrideOptions.maxTokens")}
                        />
                    </Group>
                </Stack>

                <Group justify="flex-end">
                    <Button type="submit" loading={isLoading}>
                        실행
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
