"use client";

import React from "react";
import {
    Button,
    Container,
    Grid,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    rem,
} from "@mantine/core";
import {
    IconArrowsDiff,
    IconBookmarks,
    IconBrandOpenai,
    IconBriefcase,
    IconDeviceDesktopAnalytics,
    IconHistory,
} from "@tabler/icons-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const features = [
    {
        icon: IconDeviceDesktopAnalytics,
        title: "Playground",
        description: "LLM API를 호출하고 Streaming 응답을 실시간으로 확인하세요. 여러 벤더의 모델을 빠르게 테스트해볼 수 있습니다.",
    },
    {
        icon: IconArrowsDiff,
        title: "Compare (TBD)",
        description: "같은 프롬프트로 여러 모델의 응답을 동시에 요청하고 비교(Diff)하여 최적의 모델을 찾으세요.",
    },
    {
        icon: IconBookmarks,
        title: "Named Prompt",
        description: "잘 만든 프롬프트를 저장하고 버전 관리하세요. 팀원들과 공유하여 재사용성을 높일 수 있습니다.",
    },
    {
        icon: IconHistory,
        title: "LLM Call Logs",
        description: "모든 API 호출 내역을 상세하게 기록합니다. 비용 관리와 디버깅을 위한 투명성을 제공합니다.",
    },
    {
        icon: IconBriefcase,
        title: "Workspace",
        description: "프로젝트나 관심사별로 워크스페이스를 나누어 데이터를 효율적으로 관리하세요.",
    },
];

type LandingPageProps = {
    heroAction?: React.ReactNode;
};

export function LandingPage({ heroAction }: LandingPageProps) {
    return (
        <Container size="lg" py="xl">
            {/* Hero Section */}
            <Stack align="center" gap="xl" my={60} ta="center">
                <Title
                    order={1}
                    size={rem(48)}
                    fw={900}
                >PromptBox</Title>
                <Title
                    order={1}
                    size={rem(48)}
                    fw={900}
                    style={{ lineHeight: 1.1 }}
                >
                    프롬프트를 <Text component="span" c="blue" inherit>테스트</Text>하고 <Text component="span" c="blue" inherit>관리</Text>할 수 있습니다.
                </Title>
                <Text c="dimmed" size="lg" maw={600} mx="auto">
                    PromptBox는 LLM 개발 및 운영을 위한 올인원 플랫폼입니다.
                    단순한 API 호출을 넘어, 프롬프트 엔지니어링의 생산성을 극대화하세요.
                </Text>
                {heroAction ? (
                    heroAction
                ) : (
                    <Button
                        size="xl"
                        radius="md"
                        component={Link}
                        href="/login"
                    >
                        시작하기
                    </Button>
                )}
            </Stack>

            {/* Features Section */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={80}>
                {features.map((feature, index) => (
                    <Paper
                        key={index}
                        shadow="sm"
                        radius="md"
                        p="xl"
                        withBorder
                    >
                        <ThemeIcon
                            size={50}
                            radius="md"
                            variant="light"
                            color="blue"
                            mb="md"
                        >
                            <feature.icon style={{ width: rem(26), height: rem(26) }} />
                        </ThemeIcon>
                        <Text size="lg" fw={700} mb="xs">
                            {feature.title}
                        </Text>
                        <Text c="dimmed" size="sm" lh={1.6}>
                            {feature.description}
                        </Text>
                    </Paper>
                ))}
            </SimpleGrid>
        </Container>
    );
}
