"use client";

import React from "react";
import Link from "next/link";
import { Alert, Button, Paper, Stack, Text, Title } from "@mantine/core";

type OutputPanelProps = {
    outputText?: string;
    callId?: string;
    workspaceId: string;
    errorMessage?: string;
};

export function OutputPanel({ outputText, callId, workspaceId, errorMessage }: OutputPanelProps) {
    return (
        <Paper p="md" withBorder>
            <Stack>
                <Title order={4}>Output</Title>
                {errorMessage && (
                    <Alert color="red" title="실행 오류">
                        {errorMessage}
                    </Alert>
                )}
                <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
                    {outputText || "아직 실행 결과가 없습니다."}
                </Text>
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
