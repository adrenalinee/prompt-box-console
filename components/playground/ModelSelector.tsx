"use client";

import React from "react";
import { ActionIcon, Button, Group, Modal, Stack, Text, Alert, TextInput, ScrollArea, Table } from "@mantine/core";
import { IconAdjustments, IconSearch, IconServer } from "@tabler/icons-react";
import type { ApiKey, Model, Vendor } from "@/lib/api/settings";

type ModelSelectorProps = {
    models: Model[];
    modelsError?: unknown;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;

    apiKeys: ApiKey[];
    apiKeysError?: unknown;
    selectedApiKeyId: string;
    onApiKeyChange: (apiKeyId: string) => void;

    vendors: Vendor[];
    vendorsError?: unknown;
    vendorId?: string; // Filter by vendor
    onVendorChange?: (vendorId: string | null) => void;

    workspaceDefaultModelId?: number; // New prop for default workspace model

    onOptionsClick: () => void;
};

export function ModelSelector({
    models,
    modelsError,
    selectedModelId,
    onModelChange,
    apiKeys,
    apiKeysError,
    selectedApiKeyId,
    onApiKeyChange,
    vendors,
    vendorsError,
    vendorId,
    onVendorChange,
    workspaceDefaultModelId,
    onOptionsClick,
}: ModelSelectorProps) {
    const [modalOpen, setModalOpen] = React.useState(false);
    const [modelSearch, setModelSearch] = React.useState("");

    const vendorMap = React.useMemo(() => new Map(vendors.map((v) => [v.id, v.name])), [vendors]);

    // Derived state for display
    const selectedModel = models.find((m) => String(m.id) === selectedModelId);
    const selectedKey = apiKeys.find((k) => k.id === selectedApiKeyId);

    const selectedKeyLabel = selectedKey
        ? `${vendorMap.get(selectedKey.vendorId) ?? selectedKey.vendorId} / ${selectedKey.name || selectedKey.id
        }`
        : "-";

    // Filtering logic for the modal
    const filteredModels = React.useMemo(() => {
        return models.filter((model) => {
            if (vendorId && model.vendorId !== vendorId) return false;
            const keyword = modelSearch.toLowerCase();
            const name = model.name || "";
            return (
                name.toLowerCase().includes(keyword) ||
                model.modelKey.toLowerCase().includes(keyword)
            );
        });
    }, [models, vendorId, modelSearch]);

    // Fallback & Auto-selection Logic
    const isInitializedRef = React.useRef(false);

    React.useEffect(() => {
        if (!models.length) return;

        // If we already have a valid selected model, do nothing
        if (selectedModelId && models.find(m => String(m.id) === selectedModelId)) {
            // Ensure API key is also valid for this model
            const currentModel = models.find(m => String(m.id) === selectedModelId);
            if (currentModel) {
                const validKeys = apiKeys.filter(k => k.vendorId === currentModel.vendorId);
                if (validKeys.length > 0 && !validKeys.find(k => k.id === selectedApiKeyId)) {
                    // Current key is invalid for this model, select first valid key
                    onApiKeyChange(validKeys[0].id);
                } else if (validKeys.length === 0 && selectedApiKeyId) {
                    onApiKeyChange("");
                }
            }
            return;
        }

        // --- Selection Strategy ---
        // 1. Workspace Default Model (if valid)
        // 2. First compiled model linked to an existing API Key
        // 3. First available model

        let targetModelId = "";

        // Strategy 1
        if (workspaceDefaultModelId) {
            const defaultModel = models.find(m => m.id === workspaceDefaultModelId);
            if (defaultModel) {
                targetModelId = String(defaultModel.id);
            }
        }

        // Strategy 2 (if strategy 1 failed)
        if (!targetModelId) {
            const hasApiKeyVendor = new Set(apiKeys.map((key) => key.vendorId));
            const availableModels = models.filter((model) => hasApiKeyVendor.has(model.vendorId));
            if (availableModels.length > 0) {
                targetModelId = String(availableModels[0].id);
            }
        }

        // Strategy 3 (Fallback)
        if (!targetModelId && models.length > 0) {
            targetModelId = String(models[0].id);
        }

        if (targetModelId && targetModelId !== selectedModelId) {
            onModelChange(targetModelId);
        }

    }, [models, apiKeys, selectedModelId, workspaceDefaultModelId]);

    const getErrorMessage = (error: unknown): string => {
        if (!error) return "";
        if (typeof error === "string") return error;
        if (typeof error === "object" && "message" in error) {
            return String((error as { message?: string }).message);
        }
        return "모델 목록을 불러오지 못했습니다.";
    };

    return (
        <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
                <Button
                    variant="default"
                    leftSection={<IconServer size={16} />}
                    onClick={() => setModalOpen(true)}
                >
                    {selectedModel ? `모델: ${selectedModel.name || selectedModel.modelKey}` : "모델 선택"}
                </Button>
                <Text size="xs" c="dimmed" lineClamp={2}>
                    {selectedKeyLabel}
                </Text>
            </Group>
            <ActionIcon variant="light" onClick={onOptionsClick}>
                <IconAdjustments size={16} />
            </ActionIcon>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="모델 선택"
                size="lg"
            >
                <Stack>
                    {modelsError && (
                        <Alert color="red" title="오류">
                            {getErrorMessage(modelsError)}
                        </Alert>
                    )}
                    <TextInput
                        placeholder="모델 검색"
                        leftSection={<IconSearch size={16} />}
                        value={modelSearch}
                        onChange={(event) => setModelSearch(event.currentTarget.value)}
                    />
                    <ScrollArea h={360}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Name</Table.Th>
                                    <Table.Th>Vendor</Table.Th>
                                    <Table.Th>Key</Table.Th>
                                    <Table.Th ta="right">Action</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredModels.map((model) => (
                                    <Table.Tr key={model.id}>
                                        <Table.Td>{model.name || model.modelKey}</Table.Td>
                                        <Table.Td>{vendorMap.get(model.vendorId) ?? model.vendorId}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {model.modelKey}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end">
                                                {String(model.id) === selectedModelId && (
                                                    <Text size="xs" c="teal">
                                                        선택됨
                                                    </Text>
                                                )}
                                                <Button
                                                    size="xs"
                                                    onClick={() => {
                                                        onModelChange(String(model.id));
                                                        setModalOpen(false);
                                                    }}
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
