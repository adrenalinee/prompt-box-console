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
import { IconExternalLink } from "@tabler/icons-react";

export type OutputContentPart = {
    part: string;
    text: string;
    firstDeltaMs?: number;
    doneMs?: number;
};

export type OutputBlock = {
    index: number;
    kind: "message" | "reasoning";
    parts: OutputContentPart[];
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
    const hasOutput = blocks.some((block) => block.parts.some((p) => p.text.trim().length > 0));

    // Collect all part keys to default expanded? Or just rely on user interaction.
    // Let's expand everything by default for now, or at least the latest?
    // User probably wants to see text as it streams.
    // For now, let's pick a strategy: "message" parts expanded by default. "reasoning" parts... maybe collapsed?
    // The previous code defaulted reasoning to expanded (value={value} and defaultValue={value}).

    // Let's just create unique IDs for all parts and pass them to defaultValue if we want them open.
    // But since blocks change dynamically, controlled accordion might be tricky or jerky.
    // Uncontrolled with defaultValue is safer for streaming updates if keys are stable.

    return (
        <Paper p="md" withBorder>
            <Stack>
                <Group gap="xs" align="baseline">
                    <Title order={4}>Output</Title>
                    {callId && (
                        <Button
                            size="sm"
                            rightSection={<IconExternalLink />}
                            component={Link}
                            target="_blank"
                            href={`/workspaces/${workspaceId}/logs/${callId}`}
                            variant="light"
                        >
                            Logs 상세 보기
                        </Button>

                        // <Anchor
                        //     size="sm"
                        //     c="dimmed"
                        //     component={Link}
                        //     target="_blank"
                        //     href={`/workspaces/${workspaceId}/logs/${callId}`}
                        // >
                        //     {callId}
                        // </Anchor>
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
                    <Accordion
                        variant="separated"
                        radius="md"
                        multiple
                        defaultValue={blocks.map((b) => String(b.index))}
                    >
                        {blocks.map((block) => {
                            // Filter valid parts
                            const validParts = block.parts.filter((p) => p.text.trim().length > 0);
                            if (validParts.length === 0) return null;

                            return (
                                <Accordion.Item key={block.index} value={String(block.index)}>
                                    <Accordion.Control>
                                        <Group justify="space-between" pr="sm">
                                            <Text fw={600} style={{ textTransform: "capitalize" }}>
                                                {block.kind}
                                            </Text>
                                            {/* Maybe show total duration if we calculate it? */}
                                        </Group>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="sm">
                                            {validParts.map((part) => {
                                                const partKey = `${block.index}-${part.part}`;
                                                const timingText = `first delta ${formatMs(
                                                    part.firstDeltaMs,
                                                )} · done ${formatMs(part.doneMs)}`;

                                                let label: string = part.part;
                                                if (block.kind === "reasoning") {
                                                    label = part.part.startsWith("summary-")
                                                        ? "Reasoning Summary"
                                                        : "Reasoning Process";
                                                } else {
                                                    label = "Message Content";
                                                }

                                                return (
                                                    <Paper key={partKey} p="xs" withBorder bg="gray.0">
                                                        <Group justify="space-between" mb={4}>
                                                            <Text size="xs" fw={700} c="dimmed">
                                                                {label}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {timingText}
                                                            </Text>
                                                        </Group>
                                                        <Text
                                                            component="pre"
                                                            c={
                                                                block.kind === "reasoning"
                                                                    ? "dimmed"
                                                                    : undefined
                                                            }
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
                                                );
                                            })}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion>
                )}
                {/*{callId && (*/}
                {/*    <Button*/}
                {/*        component={Link}*/}
                {/*        href={`/workspaces/${workspaceId}/logs/${callId}`}*/}
                {/*        variant="light"*/}
                {/*    >*/}
                {/*        Logs 상세 보기*/}
                {/*    </Button>*/}
                {/*)}*/}
            </Stack>
        </Paper>
    );
}
