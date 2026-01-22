"use client";

import React from "react";
import {
    Alert,
    Button,
    Group,
    SegmentedControl,
    Select,
    Stack,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import type { Prompt, PromptRef, Snapshot } from "@/lib/api/prompts";
import type { ApiKey, Model, Vendor } from "@/lib/api/settings";

export type ExecuteFormValues = {
    sourceType: "REF" | "SNAPSHOT" | "RAW";
    promptId: string;
    refId: string;
    snapshotId: string;
    instructions: string;
    modelId: string;
    apiKeyId: string;
    overrideOptions: string;
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
        overrideOptionsJson?: string;
    }) => void;
    isLoading?: boolean;
};

export function ExecutePanel({
    prompts,
    refs,
    snapshots,
    models,
    apiKeys,
    initialPromptId,
    initialSnapshotId,
    onPromptChange,
    onExecute,
    isLoading,
}: ExecutePanelProps) {
    const promptOptions = prompts.map((prompt) => ({ value: prompt.id, label: prompt.name }));
    const refOptions = refs.map((ref) => ({
        value: String(ref.id),
        label: `${ref.name} (${ref.type})`,
    }));
    const snapshotOptions = snapshots.map((snapshot) => ({
        value: snapshot.id,
        label: snapshot.version ?? snapshot.id,
    }));
    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${vendorMap.get(model.vendorId) ?? model.vendorId} / ${model.modelKey}`,
    }));
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
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
            overrideOptions: "",
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
    }, [refs, snapshots, modelOptions, apiKeyOptions]);

    const selectedModel = models.find((model) => String(model.id) === form.values.modelId);
    const selectedKey = apiKeys.find((key) => key.id === form.values.apiKeyId);
    const vendorMismatch =
        selectedModel && selectedKey ? selectedModel.vendorId !== selectedKey.vendorId : false;

    return (
        <form
            onSubmit={form.onSubmit((values) => {
                let overrideOptionsJson: string | undefined;
                if (values.overrideOptions.trim().length > 0) {
                    try {
                        JSON.parse(values.overrideOptions);
                        overrideOptionsJson = values.overrideOptions;
                    } catch {
                        showNotification({
                            color: "red",
                            title: "JSON 오류",
                            message: "overrideOptions JSON 형식이 올바르지 않습니다.",
                        });
                        return;
                    }
                }

                onExecute({
                    sourceType: values.sourceType,
                    refId: values.refId ? Number(values.refId) : undefined,
                    snapshotId: values.snapshotId || undefined,
                    instructions: values.instructions || undefined,
                    modelId: values.modelId,
                    apiKeyId: values.apiKeyId,
                    overrideOptionsJson,
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
                    value={vendorId}
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

                <Textarea
                    label="overrideOptions (JSON)"
                    minRows={4}
                    autosize
                    {...form.getInputProps("overrideOptions")}
                />

                <Group justify="flex-end">
                    <Button type="submit" loading={isLoading}>
                        실행
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
