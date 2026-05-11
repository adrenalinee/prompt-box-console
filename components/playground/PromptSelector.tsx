"use client";

import React from "react";
import { ActionIcon, Badge, Button, Group, Menu, Modal, ScrollArea, Stack, Table, Text, TextInput, Tooltip } from "@mantine/core";
import { IconDotsVertical, IconFileText, IconGitBranch, IconSearch } from "@tabler/icons-react";
import type { Prompt, PromptRef } from "@/lib/api/prompts";

type PromptSelectorProps = {
    prompts: Prompt[];
    promptsError?: unknown;
    selectedPromptId: string;
    onPromptChange: (promptId: string) => void;

    refs: PromptRef[];
    refsError?: unknown;
    selectedRefId: string;
    onRefChange: (refId: string) => void;

    // Actions requiring detailed state logic
    isModified: boolean;
    hasPromptContent: boolean;

    onCreatePrompt: () => void;
    onCreateTag: () => void;
    onSaveChanges: () => void;
    onCreateBranch: () => void;

    // For handling prompt change confirmation if modified
    onRequestPromptChange: (promptId: string, name?: string) => void;

    // Added: Reset handler
    onReset: () => void;
};

export function PromptSelector({
    prompts,
    selectedPromptId,
    refs,
    selectedRefId,
    onRefChange,
    isModified,
    hasPromptContent,
    onCreatePrompt,
    onCreateTag,
    onSaveChanges,
    onCreateBranch,
    onRequestPromptChange,
    onReset,
}: PromptSelectorProps) {

    const [promptModalOpen, setPromptModalOpen] = React.useState(false);
    const [refModalOpen, setRefModalOpen] = React.useState(false);
    const [promptSearch, setPromptSearch] = React.useState("");

    const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
    const selectedRef = refs.find((r) => String(r.id) === selectedRefId);

    const promptLabel = selectedPrompt ? `Prompt: ${selectedPrompt.name}` : "Prompt 선택";
    const refLabel = selectedRef ? `Ref: ${selectedRef.name} (${selectedRef.type})` : "Ref 선택";

    const filteredPrompts = React.useMemo(() => prompts.filter((prompt) =>
        prompt.name.toLowerCase().includes(promptSearch.toLowerCase()),
    ), [prompts, promptSearch]);

    const canUseRefActions = !!selectedPromptId && !!selectedRefId;
    const canSaveChanges = canUseRefActions && isModified && selectedRef?.type === "BRANCH";
    const canCreateTag = canUseRefActions && selectedRef?.type === "BRANCH" && !isModified;
    const canCreateBranch = canUseRefActions && (selectedRef?.type === "TAG" || (selectedRef?.type === "BRANCH" && isModified));


    return (
        <Group justify="space-between" align="center">
            <Group gap="xs">
                <Button
                    variant="default"
                    leftSection={<IconFileText size={16} />}
                    onClick={() => setPromptModalOpen(true)}
                    type="button"
                >
                    {promptLabel}
                </Button>
                <Button
                    variant="default"
                    leftSection={<IconGitBranch size={16} />}
                    disabled={!selectedPromptId}
                    onClick={() => setRefModalOpen(true)}
                    type="button"
                >
                    {refLabel}
                </Button>
            </Group>
            <Group gap="xs">
                {isModified && (
                    <Button
                        variant="light"
                        color="orange"
                        size="compact-xs"
                        onClick={onReset}
                    >
                        수정됨 (되돌리기)
                    </Button>
                )}
                <Menu shadow="md" position="bottom-end" width={280}>
                    <Menu.Target>
                        <ActionIcon variant="light" type="button">
                            <IconDotsVertical size={16} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Tooltip
                            label="내용이 비어 있어 생성할 수 없습니다."
                            disabled={hasPromptContent}
                            withArrow
                        >
                            <div>
                                <Menu.Item
                                    disabled={!hasPromptContent}
                                    onClick={onCreatePrompt}
                                    component="button"
                                    type="button"
                                >
                                    <Text fw={500}>새 프롬프트 생성</Text>
                                    <Text size="xs" c="dimmed">
                                        현재 입력된 내용으로 새로운 프롬프트를 생성합니다.
                                    </Text>
                                </Menu.Item>
                            </div>
                        </Tooltip>
                        <Menu.Item
                            disabled={!canCreateTag}
                            onClick={onCreateTag}
                            component="button"
                            type="button"
                        >
                            <Text fw={500}>tag 생성</Text>
                            <Text size="xs" c="dimmed">
                                현재 branch의 내용을 태그로 고정합니다.
                            </Text>
                        </Menu.Item>
                        <Menu.Item
                            disabled={!canSaveChanges}
                            onClick={onSaveChanges}
                            component="button"
                            type="button"
                        >
                            <Text fw={500}>수정내역 저장</Text>
                            <Text size="xs" c="dimmed">
                                수정된 내용을 현재 branch에 저장합니다.
                            </Text>
                        </Menu.Item>
                        <Menu.Item
                            disabled={!canCreateBranch}
                            onClick={onCreateBranch}
                            component="button"
                            type="button"
                        >
                            <Text fw={500}>새 branch</Text>
                            <Text size="xs" c="dimmed">
                                현재 수정된 내용으로 새로운 branch를 생성합니다.
                            </Text>
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            {/* Prompt Selection Modal */}
            <Modal
                opened={promptModalOpen}
                onClose={() => setPromptModalOpen(false)}
                title="Prompt 선택"
                size="lg"
            >
                <Stack>
                    <TextInput
                        placeholder="Prompt 검색"
                        leftSection={<IconSearch size={16} />}
                        value={promptSearch}
                        onChange={(event) => setPromptSearch(event.currentTarget.value)}
                    />
                    <ScrollArea h={360}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th ta="right">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredPrompts.map((prompt) => (
                                    <Table.Tr key={prompt.id}>
                                        <Table.Td>{prompt.name}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {prompt.description ?? "-"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end">
                                                {prompt.id === selectedPromptId && (
                                                    <Text size="xs" c="teal">
                                                        선택됨
                                                    </Text>
                                                )}
                                                <Button
                                                    size="xs"
                                                    onClick={() => {
                                                        onRequestPromptChange(prompt.id, prompt.name);
                                                        setPromptModalOpen(false);
                                                    }}
                                                    type="button"
                                                >
                                                    선택
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => {
                                onRequestPromptChange("", "");
                                setPromptModalOpen(false);
                            }}
                        >
                            선택 해제
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Ref Selection Modal */}
            <Modal
                opened={refModalOpen}
                onClose={() => setRefModalOpen(false)}
                title="Reference 선택"
                size="lg"
            >
                <Stack>
                    <ScrollArea h={360}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Type</Table.Th>
                                    <Table.Th ta="right">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {refs.map((ref) => (
                                    <Table.Tr key={ref.id}>
                                        <Table.Td>{ref.name}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={ref.type === "BRANCH" ? "blue" : "gray"}
                                                variant="light"
                                            >
                                                {ref.type}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end">
                                                {String(ref.id) === selectedRefId && (
                                                    <Text size="xs" c="teal">
                                                        선택됨
                                                    </Text>
                                                )}
                                                <Button
                                                    size="xs"
                                                    onClick={() => {
                                                        onRefChange(String(ref.id));
                                                        setRefModalOpen(false);
                                                    }}
                                                    type="button"
                                                >
                                                    선택
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Stack>
            </Modal>
        </Group>
    );
}
