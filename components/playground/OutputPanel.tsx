"use client";

import React from "react";
import Link from "next/link";
import {
    Accordion,
    Alert,
    Anchor,
    Button,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core";

export type OutputBlock = {
    index: number;
    text: string;
    kind: "message" | "reasoning";
    part?: string;
    firstDeltaMs?: number;
    doneMs?: number;
};

type OutputPanelProps = {
    blocks?: OutputBlock[];
    callId?: string;
    workspaceId: string;
    errorMessage?: string;
    isStreaming?: boolean;
};

function formatMs(ms?: number) {
    if (ms === undefined) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function OutputPanel({
    blocks = [],
    callId,
    workspaceId,
    errorMessage,
    isStreaming,
}: OutputPanelProps) {
    const hasOutput = blocks.some((block) => block.text.trim().length > 0);
    return (
        <Paper p="md" withBorder>
            <Stack>
                <Group gap="xs" align="baseline">
                    <Title order={4}>Output</Title>
                    {callId && (
                        <Anchor size="sm" c="dimmed" component={Link} href={`/workspaces/${workspaceId}/logs/${callId}`}>
                            {callId}
                        </Anchor>
                    )}
                </Group>
                {errorMessage && (
                    <Alert color="red" title="실행 오류">
                        {errorMessage}
                    </Alert>
                )}
                {!hasOutput && !isStreaming && <Text c="dimmed">아직 실행 결과가 없습니다.</Text>}
                {!hasOutput && isStreaming && (
                    <Group gap="xs">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">
                            첫 응답을 기다리는 중...
                        </Text>
                    </Group>
                )}
                {hasOutput && (
                    <Stack gap="sm">
                        {blocks.map((block) => {
                            if (!block.text.trim()) return null;
                            const timingText = `first delta ${formatMs(block.firstDeltaMs)} · done ${formatMs(
                                block.doneMs,
                            )}`;
                            if (block.kind === "reasoning") {
                                const label =
                                    block.part === "SUMMARY"
                                        ? "Reasoning (summary)"
                                        : "Reasoning";
                                const value = `reasoning-${block.index}`;
                                return (
                                    <Accordion
                                        key={`out-${block.index}`}
                                        variant="separated"
                                        defaultValue={value}
                                    >
                                        <Accordion.Item value={value}>
                                            <Accordion.Control>
                                                <Group justify="space-between" w="100%">
                                                    <Text size="sm" c="dimmed">
                                                        {label}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {timingText}
                                                    </Text>
                                                </Group>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <Text
                                                    component="pre"
                                                    c="dimmed"
                                                    style={{ whiteSpace: "pre-wrap" }}
                                                >
                                                    {block.text}
                                                </Text>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    </Accordion>
                                );
                            }
                            return (
                                <Paper key={`out-${block.index}`} withBorder p="sm">
                                    <Group justify="space-between" mb={6}>
                                        <Text size="sm" c="dimmed">
                                            Message
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {timingText}
                                        </Text>
                                    </Group>
                                    <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
                                        {block.text}
                                    </Text>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
                {callId && (
                    <Button
                        component={Link}
                        href={`/workspaces/${workspaceId}/logs/${callId}`}
                        variant="light"
                    >
                        Logs 상세 보기
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
