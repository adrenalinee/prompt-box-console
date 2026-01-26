"use client";

import React from "react";
import { CopyButton, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { CallLogDetail } from "@/lib/api/llmCalls";

type LogDetailProps = {
    log: CallLogDetail;
};

function renderJson(value: unknown) {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    } catch {
        return "{}";
    }
}

export function LogDetail({ log }: LogDetailProps) {
    const callLog = log.callLog;

    return (
        <Stack>
            <Title order={3}>Log {callLog.id}</Title>
            <Paper p="md" withBorder>
                <Stack>
                    <Text>Workspace: {callLog.workspaceId ?? "-"}</Text>
                    <Text>Model: {callLog.llmModelId ?? "-"}</Text>
                    <Text>API Key: {callLog.llmApiKeyId ?? "-"}</Text>
                    <Text>Status: {callLog.status ?? "-"}</Text>
                    <Text>Elapsed: {callLog.elapsed ?? "-"}</Text>
                    <Text>Error: {callLog.errorMessage ?? "-"}</Text>
                </Stack>
            </Paper>

            <Paper p="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={600}>Instructions</Text>
                    <CopyButton value={callLog.instructions ?? ""}>
                        {({ copied, copy }) => (
                            <Text onClick={copy} c={copied ? "teal" : "blue"} style={{ cursor: "pointer" }}>
                                {copied ? "Copied" : "Copy"}
                            </Text>
                        )}
                    </CopyButton>
                </Group>
                <CodeHighlight code={callLog.instructions ?? ""} language="text" />
            </Paper>

            <Paper p="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={600}>Input Items</Text>
                    <CopyButton value={renderJson(log.inputItems)}>
                        {({ copied, copy }) => (
                            <Text onClick={copy} c={copied ? "teal" : "blue"} style={{ cursor: "pointer" }}>
                                {copied ? "Copied" : "Copy"}
                            </Text>
                        )}
                    </CopyButton>
                </Group>
                <CodeHighlight code={renderJson(log.inputItems)} language="json" />
            </Paper>

            <Paper p="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={600}>Output Items</Text>
                    <CopyButton value={renderJson(log.outputItems)}>
                        {({ copied, copy }) => (
                            <Text onClick={copy} c={copied ? "teal" : "blue"} style={{ cursor: "pointer" }}>
                                {copied ? "Copied" : "Copy"}
                            </Text>
                        )}
                    </CopyButton>
                </Group>
                <CodeHighlight code={renderJson(log.outputItems)} language="json" />
            </Paper>
        </Stack>
    );
}
