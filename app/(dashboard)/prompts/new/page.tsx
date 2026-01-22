"use client";

import React from "react";
import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { showNotification } from "@mantine/notifications";
import { useWorkspace } from "@/lib/workspace/context";
import { createPrompt } from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";

export default function NewPromptPage() {
    const { workspaceId } = useWorkspace();
    const router = useRouter();
    const queryClient = useQueryClient();

    const form = useForm({
        initialValues: {
            name: "",
            description: "",
            instructions: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: { name: string; description?: string; instructions: string }) =>
            createPrompt(workspaceId || "", values),
        onSuccess: (prompt) => {
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.prompts(workspaceId) });
            }
            showNotification({
                color: "teal",
                title: "Prompt 생성",
                message: "새 Prompt가 생성되었습니다.",
            });
            router.push(`/prompts/${prompt.id}`);
        },
    });

    return (
        <Stack>
            <Text fw={700} size="xl">
                새 Prompt 만들기
            </Text>
            <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                <Stack>
                    <TextInput label="Prompt 이름" required {...form.getInputProps("name")} />
                    <TextInput label="설명" {...form.getInputProps("description")} />
                    <Textarea
                        label="Instructions"
                        autosize
                        minRows={8}
                        {...form.getInputProps("instructions")}
                    />
                    <Group justify="flex-end">
                        <Button type="submit" loading={mutation.isPending} disabled={!workspaceId}>
                            생성
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}
