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
    const llmCallOptions = callLog.llmCallOptions ?? "";
    const llmCallOptionsJson = renderJson(
        llmCallOptions ? parseJsonSafe(llmCallOptions) ?? llmCallOptions : llmCallOptions,
    );

    function parseJsonSafe(text: string) {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    const renderItemBox = (item: any) => {
        const entries = Object.entries(item);
        // Sort entries to put id/position first, then others, then long text fields last
        const sortedEntries = entries.sort(([keyA], [keyB]) => {
            const priorityKeys = ["id", "position", "role"];
            const textKeys = ["renderedMessage", "outputText", "message"];

            const isAPriority = priorityKeys.includes(keyA);
            const isBPriority = priorityKeys.includes(keyB);
            if (isAPriority && !isBPriority) return -1;
            if (!isAPriority && isBPriority) return 1;

            const isAText = textKeys.includes(keyA);
            const isBText = textKeys.includes(keyB);
            if (isAText && !isBText) return 1;
            if (!isAText && isBText) return -1;

            return 0; // Keep original order for others
        });

        return (
            <Paper key={item.id} p="sm" withBorder bg="gray.0">
                <Stack gap="xs">
                    {sortedEntries.map(([key, value]) => {
                        if (key === "parts" && Array.isArray(value)) {
                            return (
                                <Stack key={key} gap={4}>
                                    <Text fw={500} size="sm" style={{ textTransform: "capitalize" }}>
                                        Parts:
                                    </Text>
                                    <Stack gap="xs">
                                        {value.map((part: any, index: number) => (
                                            <Paper key={index} p="xs" withBorder bg="white">
                                                <Group justify="space-between" mb={4}>
                                                    <Text size="xs" fw={700} c="dimmed">
                                                        {part.part}
                                                    </Text>
                                                </Group>
                                                <Text
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-word",
                                                        fontFamily: "monospace",
                                                    }}
                                                    size="sm"
                                                >
                                                    {part.text}
                                                </Text>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Stack>
                            );
                        }

                        const isLongText = ["renderedMessage", "outputText", "message", "instructions"].includes(key);
                        if (isLongText) {
                            return (
                                <Stack key={key} gap={4}>
                                    <Text fw={500} size="sm" style={{ textTransform: "capitalize" }}>
                                        {key.replace(/([A-Z])/g, " $1")}:
                                    </Text>
                                    <Paper p="xs" withBorder bg="white">
                                        <Text
                                            style={{
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                fontFamily: "monospace",
                                            }}
                                            size="sm"
                                        >
                                            {String(value)}
                                        </Text>
                                    </Paper>
                                </Stack>
                            );
                        }
                        return (
                            <Group key={key}>
                                <Text fw={500} size="sm" w={100} style={{ textTransform: "capitalize" }}>
                                    {key.replace(/([A-Z])/g, " $1")}:
                                </Text>
                                <Text size="sm">{String(value)}</Text>
                            </Group>
                        );
                    })}
                </Stack>
            </Paper>
        );
    };

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
                    <Text fw={600}>LLM Call Options</Text>
                    <CopyButton value={llmCallOptions}>
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
                <CodeHighlight code={llmCallOptionsJson} language="json" />
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
                <Stack>
                    {log.inputItems?.map((item) => renderItemBox(item))}
                    {!log.inputItems?.length && <Text c="dimmed">No input items.</Text>}
                </Stack>
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
                <Stack>
                    {log.outputItems?.map((item) => renderItemBox(item))}
                    {!log.outputItems?.length && <Text c="dimmed">No output items.</Text>}
                </Stack>
            </Paper>
        </Stack>
    );
}
