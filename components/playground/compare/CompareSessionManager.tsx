"use client";

import React from "react";
import { ActionIcon, Button, Divider, Grid, Group, Paper, Switch, Text, Title, Tooltip } from "@mantine/core";
import { IconPlus, IconPlayerPlay, IconArrowsDiff } from "@tabler/icons-react";
import { CompareColumnContainer } from "./CompareColumnContainer";
import type { CompactExecutePanelRef } from "./CompactExecutePanel";
import type { ExecuteFormValues } from "../types";
import type { Prompt } from "@/lib/api/prompts";
import type { Model, ApiKey, Vendor } from "@/lib/api/settings";
import type { DefaultOptions } from "@/lib/api/workspaces";

type CompareSession = {
    id: string;
    initialPromptId?: string;
    initialRefId?: string;
    initialModelId?: string;
    initialApiKeyId?: string;
};

type CompareSessionManagerProps = {
    workspaceId: string;
    prompts: Prompt[];
    promptsError?: unknown;
    models: Model[];
    modelsError?: unknown;
    apiKeys: ApiKey[];
    apiKeysError?: unknown;
    vendors: Vendor[];
    vendorsError?: unknown;
    defaultOptions?: DefaultOptions | null;
    workspaceDefaultModelId?: number;
    initialSessionState?: CompareSession | null;
};

export function CompareSessionManager({
    workspaceId,
    prompts,
    promptsError,
    models,
    modelsError,
    apiKeys,
    apiKeysError,
    vendors,
    vendorsError,
    defaultOptions,
    workspaceDefaultModelId,
    initialSessionState,
}: CompareSessionManagerProps) {
    const [sessions, setSessions] = React.useState<CompareSession[]>([]);
    const [isSyncEnabled, setIsSyncEnabled] = React.useState(true);
    const panelRefs = React.useRef<Map<string, CompactExecutePanelRef>>(new Map());

    // Initialize sessions
    React.useEffect(() => {
        if (sessions.length === 0) {
            // Default: 2 columns
            const defaults = [
                { id: `col-${Date.now()}-1`, ...initialSessionState },
                { id: `col-${Date.now()}-2`, ...initialSessionState, initialModelId: undefined }, // second col empty model?
            ];
            setSessions(defaults);
        }
    }, [initialSessionState]);

    const handleAddColumn = () => {
        setSessions((prev) => [
            ...prev,
            { id: `col-${Date.now()}` },
        ]);
    };

    const handleRemoveColumn = (id: string) => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        panelRefs.current.delete(id);
    };

    const handleRunAll = () => {
        panelRefs.current.forEach((panel) => {
            const values = panel.getValues();
            const effectiveItems = values.inputItems.filter(
                (item) => item.message.trim().length > 0
            );
            const hasContent = values.instructions.trim().length > 0 || effectiveItems.length > 0;
            if (hasContent) {
                panel.execute();
            }
        });
    };

    const handleValuesChange = (sourceId: string, values: ExecuteFormValues) => {
        if (!isSyncEnabled) return;

        // Sync inputs to other columns logic
        // We only sync instructions and inputItems. Model/Prompt selection is usually independent or handled by "Compare" start.
        // But user might want to sync Prompt selection too? 
        // "Changing Input in any column updates all columns".
        // Let's sync Instructions and InputItems.

        panelRefs.current.forEach((panel, id) => {
            if (id === sourceId) return;

            const currentVals = panel.getValues();

            // Check diff to avoid redundant updates/loops
            if (currentVals.instructions !== values.instructions) {
                panel.setInstructions(values.instructions);
            }
            if (JSON.stringify(currentVals.inputItems) !== JSON.stringify(values.inputItems)) {
                panel.setInputItems(values.inputItems);
            }
        });
    };

    return (
        <React.Fragment>
            <Group justify="space-between" align="center">
                <Group gap="sm">
                    <Text fw={700} size="xl">
                        Playground / Compare (beta!!)
                    </Text>
                    <Button
                        leftSection={<IconPlayerPlay size={16} />}
                        variant="filled"
                        onClick={handleRunAll}
                    >
                        실행
                    </Button>
                </Group>
                <Group>
                    <Switch
                        label="입력 동기화"
                        labelPosition="left"
                        checked={isSyncEnabled}
                        onChange={(event) => setIsSyncEnabled(event.currentTarget.checked)}
                    />
                    <Button
                        leftSection={<IconPlus size={16} />}
                        variant="default"
                        onClick={handleAddColumn}
                    >
                        Add Column
                    </Button>
                </Group>
            </Group>
            <Divider />
            <Grid gutter="xl">
                {sessions.map((session) => (
                    <Grid.Col key={session.id} span={{ base: 12, md: 6, lg: 4 }} style={{ minWidth: 400 }}>
                        {/*<Paper withBorder p="md" h="100%">*/}
                        <CompareColumnContainer
                            ref={(el: CompactExecutePanelRef | null) => {
                                if (el) {
                                    panelRefs.current.set(session.id, el);
                                } else {
                                    panelRefs.current.delete(session.id);
                                }
                            }}
                            workspaceId={workspaceId}
                            initialPromptId={session.initialPromptId}
                            initialRefId={session.initialRefId}
                            initialModelId={session.initialModelId}
                            initialApiKeyId={session.initialApiKeyId}
                            prompts={prompts}
                            promptsError={promptsError}
                            models={models}
                            modelsError={modelsError}
                            apiKeys={apiKeys}
                            apiKeysError={apiKeysError}
                            vendors={vendors}
                            vendorsError={vendorsError}
                            defaultOptions={defaultOptions}
                            workspaceDefaultModelId={workspaceDefaultModelId}
                            onRemove={() => handleRemoveColumn(session.id)}
                            onValuesChange={(values) => handleValuesChange(session.id, values)}
                        />
                        {/*</Paper>*/}
                    </Grid.Col>
                ))}
            </Grid>
        </React.Fragment>
    );
}
