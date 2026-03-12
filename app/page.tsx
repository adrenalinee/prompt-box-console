"use client";

import React from "react";
import {
    Alert,
    AppShell,
    Button,
    Center,
    Group,
    Loader,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
    Textarea,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconMessage2Code, IconSettings } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWorkspaces, createWorkspace } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import { UserProfileMenu } from "@/components/auth/UserProfileMenu";
import { useSession } from "next-auth/react";
import ServerPhase from "@/components/layout/ServerPhase";
import { LandingPage } from "@/components/landing/LandingPage";
import { notifications } from "@mantine/notifications";

export default function RootPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

    const { data: workspaces = [], isLoading, isError, error } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () =>
            fetchWorkspaces(0, 50, undefined, undefined, {
                suppressNotification: true,
                suppressAlert: true,
            }),
        enabled: isAuthenticated,
    });
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!selectedId && workspaces.length > 0) {
            setSelectedId(workspaces[0].id);
        }
    }, [selectedId, workspaces]);

    const options = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    // Workspace creation form
    const form = useForm({
        initialValues: {
            name: "",
            description: "",
        },
        validate: {
            name: (value) => (value.trim().length === 0 ? "워크스페이스 이름을 입력해주세요." : null),
        },
    });

    const { mutate: doCreateWorkspace, isPending: isCreating } = useMutation({
        mutationFn: (values: { name: string; description?: string }) =>
            createWorkspace({ name: values.name, description: values.description || undefined }),
        onSuccess: (newWorkspace) => {
            notifications.show({
                title: "워크스페이스 생성 완료",
                message: `"${newWorkspace.name}" 워크스페이스가 생성되었습니다.`,
                color: "green",
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
            closeCreateModal();
            form.reset();
            router.push(`/workspaces/${newWorkspace.id}/playground`);
        },
        onError: () => {
            notifications.show({
                title: "오류",
                message: "워크스페이스 생성에 실패했습니다.",
                color: "red",
            });
        },
    });

    if (status === "loading") {
        return (
            <Center h="100vh">
                <Loader />
            </Center>
        );
    }

    return (
        <>
            <AppShell header={{ height: 60 }} padding="md">
                <AppShell.Header>
                    <Group h="100%" px="md" justify="space-between">
                        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                            <Group gap={6}>
                                <IconMessage2Code size={22} stroke={1.8} />
                                <Text fw={700}>PromptBox</Text>
                            </Group>
                        </Link>
                        <Group>
                            <ServerPhase />
                            <UserProfileMenu />
                        </Group>
                    </Group>
                </AppShell.Header>
                <AppShell.Main>
                    <LandingPage
                        heroAction={
                            !session?.user ? undefined : (
                                <Stack align="center" justify="center">
                                    <Text size="lg">
                                        {session.user.name}! 안녕하세요.
                                    </Text>
                                    <Text fw={700} size="xl">
                                        Workspace 를 선택하세요.
                                    </Text>
                                    {isLoading ? (
                                        <Loader />
                                    ) : isError ? (
                                        <Alert color="red" title="오류">
                                            {error && typeof error === "object" && "message" in error
                                                ? String((error as { message?: string }).message)
                                                : "요청에 실패했습니다."}
                                        </Alert>
                                    ) : (
                                        <Group>
                                            <Select
                                                placeholder="Workspace 선택"
                                                data={options}
                                                value={selectedId}
                                                onChange={setSelectedId}
                                                w={240}
                                            />
                                            <Button
                                                onClick={() => {
                                                    if (selectedId) {
                                                        router.push(`/workspaces/${selectedId}/playground`);
                                                    }
                                                }}
                                                disabled={!selectedId}
                                            >
                                                이동
                                            </Button>
                                            <Tooltip label="새 워크스페이스 생성">
                                                <ActionIcon
                                                    variant="default"
                                                    size="lg"
                                                    onClick={openCreateModal}
                                                    aria-label="새 워크스페이스 생성"
                                                >
                                                    <IconSettings size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    )}
                                </Stack>
                            )
                        }
                    />
                </AppShell.Main>
            </AppShell>

            {/* Create Workspace Modal */}
            <Modal
                opened={createModalOpened}
                onClose={() => {
                    closeCreateModal();
                    form.reset();
                }}
                title="새 워크스페이스 만들기"
                centered
                size="md"
            >
                <form onSubmit={form.onSubmit((values) => doCreateWorkspace(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="워크스페이스 이름"
                            placeholder="예: My Project"
                            required
                            {...form.getInputProps("name")}
                        />
                        <Textarea
                            label="설명 (선택)"
                            placeholder="워크스페이스에 대한 간단한 설명을 입력하세요."
                            rows={3}
                            {...form.getInputProps("description")}
                        />
                        <Group justify="flex-end" mt="sm">
                            <Button
                                variant="default"
                                onClick={() => {
                                    closeCreateModal();
                                    form.reset();
                                }}
                                disabled={isCreating}
                            >
                                취소
                            </Button>
                            <Button type="submit" loading={isCreating}>
                                생성 후 이동
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}
