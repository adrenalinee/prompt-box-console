"use client";

import React from "react";
import { Button, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

type PromptEditorProps = {
    initialInstructions: string;
    onSave: (instructions: string) => void;
    isSaving?: boolean;
    formId?: string;
    hideLabel?: boolean;
    hideSaveButton?: boolean;
};

export function PromptEditor({
    initialInstructions,
    onSave,
    isSaving,
    formId = "prompt-editor-form",
    hideLabel,
    hideSaveButton,
}: PromptEditorProps) {
    const form = useForm({
        initialValues: {
            instructions: initialInstructions,
        },
    });

    React.useEffect(() => {
        form.setValues({ instructions: initialInstructions });
    }, [initialInstructions]);

    return (
        <form
            id={formId}
            onSubmit={form.onSubmit((values) => {
                onSave(values.instructions);
            })}
        >
            <Stack>
                <Textarea
                    label={hideLabel ? undefined : "Instructions"}
                    autosize
                    minRows={12}
                    {...form.getInputProps("instructions")}
                />
                {!hideSaveButton && (
                    <Group justify="flex-end">
                        <Button type="submit" loading={isSaving}>
                            저장
                        </Button>
                    </Group>
                )}
            </Stack>
        </form>
    );
}
