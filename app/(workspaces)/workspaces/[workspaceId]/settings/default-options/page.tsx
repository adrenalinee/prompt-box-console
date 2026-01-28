"use client";

import React from "react";
import {
    Alert,
    Button,
    Group,
    Loader,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchDefaultOptions, upsertDefaultOptions } from "@/lib/api/workspaces";
import { showNotification } from "@mantine/notifications";

export default function WorkspaceDefaultOptionsPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: workspaceId ? ["workspace-default-options", workspaceId] : [],
        queryFn: () => fetchDefaultOptions(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const form = useForm({
        initialValues: {
            temperature: "" as number | "",
            topP: "" as number | "",
            maxTokens: "" as number | "",
            textFormat: "",
            effort: "",
            verbosity: "",
            summary: "",
        },
    });

    React.useEffect(() => {
        if (!data) {
            form.reset();
            return;
        }
        form.setValues({
            temperature: data.temperature ?? "",
            topP: data.topP ?? "",
            maxTokens: data.maxTokens ?? "",
            textFormat: data.textFormat ?? "",
            effort: data.effort ?? "",
            verbosity: data.verbosity ?? "",
            summary: data.summary ?? "",
        });
    }, [data]);

    const mutation = useMutation({
        mutationFn: (values: {
            temperature?: number;
            topP?: number;
            maxTokens?: number;
            textFormat?: string;
            effort?: string;
            verbosity?: string;
            summary?: string;
        }) => upsertDefaultOptions(workspaceId, values),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["workspace-default-options", workspaceId],
            });
            showNotification({
                color: "teal",
                title: "저장 완료",
                message: "Default Options가 저장되었습니다.",
            });
        },
    });

    if (!workspaceId) {
        return <Text c="dimmed">Workspace를 불러올 수 없습니다.</Text>;
    }

    if (isLoading) {
        return <Loader />;
    }

    if (isError) {
        return (
            <Alert color="red" title="오류">
                {error && typeof error === "object" && "message" in error
                    ? String((error as { message?: string }).message)
                    : "요청에 실패했습니다."}
            </Alert>
        );
    }

    return (
        <Stack>
            <Text fw={700} size="xl">
                Default Options
            </Text>
            <Text c="dimmed" size="sm">
                Playground 실행 시 기본으로 적용되는 LLM 옵션을 설정합니다. 필요하면 실행 시
                개별 요청에서 값을 덮어쓸 수 있습니다.
            </Text>
            <form
                onSubmit={form.onSubmit((values) => {
                    mutation.mutate({
                        temperature: values.temperature === "" ? undefined : values.temperature,
                        topP: values.topP === "" ? undefined : values.topP,
                        maxTokens: values.maxTokens === "" ? undefined : values.maxTokens,
                        textFormat: values.textFormat.trim() || undefined,
                        effort: values.effort || undefined,
                        verbosity: values.verbosity || undefined,
                        summary: values.summary || undefined,
                    });
                })}
            >
                <Stack>
                    <Group grow>
                        <NumberInput
                            label="temperature"
                            decimalScale={2}
                            {...form.getInputProps("temperature")}
                        />
                        <NumberInput label="topP" {...form.getInputProps("topP")} />
                        <NumberInput label="maxTokens" {...form.getInputProps("maxTokens")} />
                    </Group>
                    <Group grow>
                        <TextInput label="textFormat" {...form.getInputProps("textFormat")} />
                        <Select
                            label="effort"
                            data={[
                                { value: "DEFAULT", label: "DEFAULT" },
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                            ]}
                            clearable
                            value={form.values.effort || null}
                            onChange={(value) => form.setFieldValue("effort", value ?? "")}
                        />
                        <Select
                            label="verbosity"
                            data={[
                                { value: "LOW", label: "LOW" },
                                { value: "MEDIUM", label: "MEDIUM" },
                                { value: "HIGH", label: "HIGH" },
                            ]}
                            clearable
                            value={form.values.verbosity || null}
                            onChange={(value) => form.setFieldValue("verbosity", value ?? "")}
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
                        value={form.values.summary || null}
                        onChange={(value) => form.setFieldValue("summary", value ?? "")}
                    />
                    <Group justify="flex-end">
                        <Button type="submit" loading={mutation.isPending}>
                            저장
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}
