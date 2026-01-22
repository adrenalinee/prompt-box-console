"use client";

import React from "react";
import Link from "next/link";
import { Button, Paper, Stack, Text, Title } from "@mantine/core";

type OutputPanelProps = {
    outputText?: string;
    callId?: string;
};

export function OutputPanel({ outputText, callId }: OutputPanelProps) {
    return (
        <Paper p="md" withBorder>
            <Stack>
                <Title order={4}>Output</Title>
                <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
                    {outputText || "아직 실행 결과가 없습니다."}
                </Text>
                {callId && (
                    <Button component={Link} href={`/logs/${callId}`} variant="light">
                        Logs 상세 보기
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
