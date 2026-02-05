"use client";

import React from "react";
import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginCard() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    return (
        <Paper withBorder shadow="sm" p="xl" w={360}>
            <Stack gap="md">
                <Stack gap={4} align="center">
                    <Title order={2}>PromptBox</Title>
                    <Text c="dimmed" size="sm">
                        Google 계정으로 로그인
                    </Text>
                </Stack>
                <Button
                    fullWidth
                    size="md"
                    onClick={() => signIn("google", { callbackUrl })}
                >
                    Google로 로그인
                </Button>
            </Stack>
        </Paper>
    );
}
