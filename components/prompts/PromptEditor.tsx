"use client";

import React from "react";
import { Button, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

type PromptEditorProps = {
    initialInstructions: string;
    onSave: (instructions: string) => void;
    onChange?: (instructions: string) => void; // Added
    isSaving?: boolean;
    formId?: string;
    hideLabel?: boolean;
    hideSaveButton?: boolean;
};

export function PromptEditor({
    initialInstructions,
    onSave,
    onChange, // Added
    isSaving,
    formId = "prompt-editor-form",
    hideLabel,
    hideSaveButton,
}: PromptEditorProps) {
    const form = useForm({
        initialValues: {
            instructions: initialInstructions,
        },
        onValuesChange: (values) => {
            onChange?.(values.instructions);
        }
    });

    React.useEffect(() => {
        form.setValues({ instructions: initialInstructions });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
