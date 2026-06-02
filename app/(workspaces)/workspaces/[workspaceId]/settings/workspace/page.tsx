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
    Textarea,
    Title,
    Paper,
    Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
    fetchDefaultOptions,
    upsertDefaultOptions,
    fetchWorkspace,
    updateWorkspace,
} from "@/lib/api/workspaces";
import { fetchWorkspaceModels } from "@/lib/api/settings";
import { showNotification } from "@mantine/notifications";

export default function WorkspaceSettingsPage() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const queryClient = useQueryClient();

    // --- Workspace Details Logic ---
    const {
        data: workspaceData,
        isLoading: isWorkspaceLoading,
        isError: isWorkspaceError,
        error: workspaceError,
    } = useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: () => fetchWorkspace(workspaceId),
        enabled: !!workspaceId,
    });

    const { data: models = [] } = useQuery({
        queryKey: ["workspace-models", workspaceId],
        queryFn: () => fetchWorkspaceModels(workspaceId, undefined, 0, 100),
        enabled: !!workspaceId,
    });

    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: model.name || model.modelKey,
    }));

    const workspaceForm = useForm({
        initialValues: {
            name: "",
            description: "",
            defaultModelId: "" as string | null,
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : "이름을 입력해주세요"),
        },
    });

    React.useEffect(() => {
        if (workspaceData) {
            workspaceForm.setValues({
                name: workspaceData.name,
                description: workspaceData.description || "",
                defaultModelId: workspaceData.defaultModelId ? String(workspaceData.defaultModelId) : null,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceData]);

    const workspaceMutation = useMutation({
        mutationFn: (values: { name: string; description: string; defaultModelId?: string | null }) =>
            updateWorkspace(workspaceId, {
                ...values,
                defaultModelId: values.defaultModelId ? Number(values.defaultModelId) : null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            showNotification({
                color: "teal",
                title: "저장 완료",
                message: "Workspace 정보가 저장되었습니다.",
            });
        },
        onError: (error) => {
            showNotification({
                color: "red",
                title: "저장 실패",
                message: error && typeof error === "object" && "message" in error
                    ? String((error as { message?: string }).message)
                    : "저장에 실패했습니다.",
            });
        }
    });

    // --- Default Options Logic ---
    const {
        data: defaultOptionsData,
        isLoading: isDefaultOptionsLoading,
        isError: isDefaultOptionsError,
        error: defaultOptionsError,
    } = useQuery({
        queryKey: workspaceId ? ["workspace-default-options", workspaceId] : [],
        queryFn: () => fetchDefaultOptions(workspaceId || ""),
        enabled: !!workspaceId,
    });

    const defaultOptionsForm = useForm({
        initialValues: {
            temperature: "" as number | "",
            topP: "" as number | "",
            topK: "" as number | "",
            includeThoughts: undefined as boolean | undefined,
            maxTokens: "" as number | "",
            textFormat: "",
            effort: "",
            verbosity: "",
            summary: "",
        },
    });

    React.useEffect(() => {
        if (!defaultOptionsData) {
            return;
        }
        defaultOptionsForm.setValues({
            temperature: defaultOptionsData.temperature ?? "",
            topP: defaultOptionsData.topP ?? "",
            topK: defaultOptionsData.topK ?? "",
            includeThoughts: defaultOptionsData.includeThoughts ?? undefined,
            maxTokens: defaultOptionsData.maxTokens ?? "",
            textFormat: defaultOptionsData.textFormat ?? "",
            effort: defaultOptionsData.effort ?? "",
            verbosity: defaultOptionsData.verbosity ?? "",
            summary: defaultOptionsData.summary ?? "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultOptionsData]);

    const defaultOptionsMutation = useMutation({
        mutationFn: (values: {
            temperature?: number;
            topP?: number;
            topK?: number;
            includeThoughts?: boolean;
            maxTokens?: number;
            textFormat?: string;
            effort?: "DEFAULT" | "LOW" | "MEDIUM" | "HIGH";
            verbosity?: "LOW" | "MEDIUM" | "HIGH";
            summary?: "NONE" | "AUTO" | "CONCISE" | "DETAILED";
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
        onError: (error) => {
            showNotification({
                color: "red",
                title: "저장 실패",
                message: error && typeof error === "object" && "message" in error
                    ? String((error as { message?: string }).message)
                    : "저장에 실패했습니다.",
            });
        }
    });

    if (!workspaceId) {
        return <Text c="dimmed">Workspace를 불러올 수 없습니다.</Text>;
    }

    if (isWorkspaceLoading || isDefaultOptionsLoading) {
        return <Loader />;
    }

    if (isWorkspaceError) {
        return (
            <Alert color="red" title="오류">
                {workspaceError && typeof workspaceError === "object" && "message" in workspaceError
                    ? String((workspaceError as { message?: string }).message)
                    : "Workspace 정보를 불러오는데 실패했습니다."}
            </Alert>
        );
    }

    return (
        <Stack gap="xl">
            {/* Workspace Info Section */}
            <Stack>
                <Title order={3}>Workspace Information</Title>
                <Alert>워크스페이스의 기본 환경을 설정합니다.</Alert>
                <Paper withBorder p="md">
                    <form
                        onSubmit={workspaceForm.onSubmit((values) =>
                            workspaceMutation.mutate(values)
                        )}
                    >
                        <Stack>
                            <TextInput
                                label="이름"
                                placeholder="Workspace 이름"
                                required
                                {...workspaceForm.getInputProps("name")}
                            />
                            <Textarea
                                label="설명"
                                placeholder="Workspace 설명"
                                autosize
                                minRows={2}
                                {...workspaceForm.getInputProps("description")}
                            />
                            <Select
                                label="기본 모델"
                                description="Playground에서 기본으로 선택될 모델입니다."
                                data={modelOptions}
                                clearable
                                searchable
                                {...workspaceForm.getInputProps("defaultModelId")}
                            />
                            <Group justify="flex-end">
                                <Button
                                    type="submit"
                                    loading={workspaceMutation.isPending}
                                >
                                    저장
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>
            </Stack>

            <Divider />

            {/* Default Options Section */}
            <Stack>
                <Title order={3}>Default Options</Title>
                <Alert>
                    Playground 실행 시 기본으로 적용되는 LLM 옵션을 설정합니다. 필요하면 실행 시
                    개별 요청에서 값을 덮어쓸 수 있습니다.
                </Alert>

                {isDefaultOptionsError && (
                    <Alert color="red" title="오류" mb="sm">
                        {defaultOptionsError && typeof defaultOptionsError === "object" && "message" in defaultOptionsError
                            ? String((defaultOptionsError as { message?: string }).message)
                            : "Default Options를 불러오는데 실패했습니다."}
                    </Alert>
                )}

                <Paper withBorder p="md">
                    <form
                        onSubmit={defaultOptionsForm.onSubmit((values) => {
                            defaultOptionsMutation.mutate({
                                temperature: values.temperature === "" ? undefined : values.temperature,
                                topP: values.topP === "" ? undefined : values.topP,
                                topK: values.topK === "" ? undefined : values.topK,
                                includeThoughts: values.includeThoughts,
                                maxTokens: values.maxTokens === "" ? undefined : values.maxTokens,
                                textFormat: values.textFormat.trim() || undefined,
                                effort: (values.effort || undefined) as "DEFAULT" | "LOW" | "MEDIUM" | "HIGH" | undefined,
                                verbosity: (values.verbosity || undefined) as "LOW" | "MEDIUM" | "HIGH" | undefined,
                                summary: (values.summary || undefined) as "NONE" | "NONE" | "AUTO" | "CONCISE" | "DETAILED" | undefined,
                            });
                        })}
                    >
                        <Stack>
                            <Group grow>
                                <NumberInput
                                    label="temperature"
                                    decimalScale={2}
                                    {...defaultOptionsForm.getInputProps("temperature")}
                                />
                                <NumberInput
                                    label="topP"
                                    decimalScale={2}
                                    {...defaultOptionsForm.getInputProps("topP")}
                                />
                                <NumberInput
                                    label="topK"
                                    {...defaultOptionsForm.getInputProps("topK")}
                                />
                                <NumberInput
                                    label="maxTokens"
                                    {...defaultOptionsForm.getInputProps("maxTokens")}
                                />
                            </Group>
                            <Group grow>
                                <TextInput
                                    label="textFormat"
                                    {...defaultOptionsForm.getInputProps("textFormat")}
                                />
                                <Select
                                    label="Include Thoughts"
                                    data={[
                                        { value: "true", label: "Yes" },
                                        { value: "false", label: "No" },
                                    ]}
                                    value={
                                        defaultOptionsForm.values.includeThoughts === null ||
                                            defaultOptionsForm.values.includeThoughts === undefined
                                            ? null
                                            : defaultOptionsForm.values.includeThoughts
                                                ? "true"
                                                : "false"
                                    }
                                    onChange={(value) => {
                                        let nextValue: boolean | null | undefined = undefined;
                                        if (value === "true") nextValue = true;
                                        if (value === "false") nextValue = false;
                                        defaultOptionsForm.setFieldValue("includeThoughts", nextValue);
                                    }}
                                    clearable
                                />
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
                                    value={defaultOptionsForm.values.effort || null}
                                    onChange={(value) =>
                                        defaultOptionsForm.setFieldValue("effort", value ?? "")
                                    }
                                />
                                <Select
                                    label="verbosity"
                                    data={[
                                        { value: "LOW", label: "LOW" },
                                        { value: "MEDIUM", label: "MEDIUM" },
                                        { value: "HIGH", label: "HIGH" },
                                    ]}
                                    clearable
                                    value={defaultOptionsForm.values.verbosity || null}
                                    onChange={(value) =>
                                        defaultOptionsForm.setFieldValue("verbosity", value ?? "")
                                    }
                                />
                            </Group>
                            <Select
                                label="summary"
                                data={[
                                    { value: "NONE", label: "NONE" },
                                    { value: "AUTO", label: "AUTO" },
                                    { value: "CONCISE", label: "CONCISE" },
                                    { value: "DETAILED", label: "DETAILED" },
                                ]}
                                clearable
                                value={defaultOptionsForm.values.summary || null}
                                onChange={(value) =>
                                    defaultOptionsForm.setFieldValue("summary", value ?? "")
                                }
                            />
                            <Group justify="flex-end">
                                <Button
                                    type="submit"
                                    loading={defaultOptionsMutation.isPending}
                                >
                                    저장
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>
            </Stack>
        </Stack>
    );
}
