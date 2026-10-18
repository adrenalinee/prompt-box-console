"use client";

import React from "react";
import { Alert, Button, Divider, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type LoginCardProps = {
    localDevLoginEnabled?: boolean;
};

export default function LoginCard({ localDevLoginEnabled = false }: LoginCardProps) {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    // credentials 로그인 실패 시 next-auth 가 ?error=CredentialsSignin 으로 돌려보낸다.
    const error = searchParams.get("error");

    const [email, setEmail] = React.useState("local-user@localhost");
    const [name, setName] = React.useState("");

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

                {localDevLoginEnabled && (
                    <>
                        <Divider label="로컬 개발용" labelPosition="center" />
                        {error === "CredentialsSignin" && (
                            <Alert color="red" variant="light">
                                로컬 로그인에 실패했습니다. 백엔드를 local profile 로 실행했는지 확인하세요.
                            </Alert>
                        )}
                        <TextInput
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Name"
                            placeholder="(선택)"
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                        />
                        <Button
                            fullWidth
                            size="md"
                            variant="light"
                            onClick={() => signIn("local-dev", { email, name, callbackUrl })}
                        >
                            로컬 계정으로 로그인
                        </Button>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
