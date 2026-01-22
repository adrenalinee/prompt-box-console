"use client";

import React from "react";
import { Button, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

type PromptEditorProps = {
    initialInstructions: string;
    onSave: (instructions: string) => void;
    isSaving?: boolean;
};

export function PromptEditor({
    initialInstructions,
    onSave,
    isSaving,
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
            onSubmit={form.onSubmit((values) => {
                onSave(values.instructions);
            })}
        >
            <Stack>
                <Textarea
                    label="Instructions"
                    autosize
                    minRows={12}
                    {...form.getInputProps("instructions")}
                />
                <Group justify="flex-end">
                    <Button type="submit" loading={isSaving}>
                        저장
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
