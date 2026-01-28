"use client";

import React from "react";
import { CopyButton, Group, Paper, Spoiler, Stack, Text, Title } from "@mantine/core";
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
    const errorMessage = callLog.errorMessage ?? "";
    const instructions = callLog.instructions ?? "";

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
                </Stack>
            </Paper>

            <Paper p="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={600}>Error Message</Text>
                    <CopyButton value={errorMessage}>
                        {({ copied, copy }) => (
                            <Text
                                onClick={copy}
                                c={copied ? "teal" : "blue"}
                                style={{ cursor: "pointer" }}
                            >
                                {copied ? "Copied" : "Copy"}
                            </Text>
                        )}
                    </CopyButton>
                </Group>
                <Spoiler maxHeight={96} showLabel="더 보기" hideLabel="접기">
                    <Text
                        component="pre"
                        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                        {errorMessage || "-"}
                    </Text>
                </Spoiler>
            </Paper>

            <Paper p="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={600}>Instructions</Text>
                    <CopyButton value={instructions}>
                        {({ copied, copy }) => (
                            <Text
                                onClick={copy}
                                c={copied ? "teal" : "blue"}
                                style={{ cursor: "pointer" }}
                            >
                                {copied ? "Copied" : "Copy"}
                            </Text>
                        )}
                    </CopyButton>
                </Group>
                <Spoiler maxHeight={96} showLabel="더 보기" hideLabel="접기">
                    <Text
                        component="pre"
                        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                        {instructions || "-"}
                    </Text>
                </Spoiler>
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
