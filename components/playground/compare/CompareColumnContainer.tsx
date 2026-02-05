"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRefs, fetchAdditionalInputs } from "@/lib/api/prompts";
import { queryKeys } from "@/lib/query/keys";
import { CompactExecutePanel, type CompactExecutePanelRef } from "./CompactExecutePanel";
import { type OutputBlock } from "@/components/playground/OutputPanel";
import { usePlaygroundExecution } from "../usePlaygroundExecution";
import { OutputPanel } from "@/components/playground/OutputPanel";
import type { Prompt } from "@/lib/api/prompts";
import type { Model, ApiKey, Vendor } from "@/lib/api/settings";
import type { DefaultOptions } from "@/lib/api/workspaces";
import type { InputItemForm } from "../types";
import {Spoiler} from "@mantine/core";

type CompareColumnContainerProps = {
    workspaceId: string;
    initialPromptId?: string;
    initialRefId?: string;
    initialModelId?: string;
    initialApiKeyId?: string;
    initialOverrideInstructions?: string;
    initialInputItems?: InputItemForm[];

    // Global Data
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

    onRemove?: () => void;
    onValuesChange?: (values: any) => void;
};

export const CompareColumnContainer = React.forwardRef<CompactExecutePanelRef, CompareColumnContainerProps>(({
    workspaceId,
    initialPromptId,
    initialRefId,
    initialModelId,
    initialApiKeyId,
    initialOverrideInstructions,
    initialInputItems,
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
    onRemove,
    onValuesChange,
}, ref) => {
    const [selectedPromptId, setSelectedPromptId] = React.useState<string>(initialPromptId || "");
    const [selectedRefId, setSelectedRefId] = React.useState<string>(initialRefId || "");
    const [selectedModelId, setSelectedModelId] = React.useState<string>(initialModelId || "");
    const [selectedApiKeyId, setSelectedApiKeyId] = React.useState<string>(initialApiKeyId || "");
    const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null); // TODO: Derive from model?

    const {
        execute,
        stop, // could expose via ref if needed? Or execute implies start. Stop button in OutputPanel? No OutputPanel doesn't have stop.
        outputBlocks,
        callId,
        outputError,
        isStreaming,
        isCancelled,
    } = usePlaygroundExecution({ workspaceId });

    // Sync state with initial props if they change (optional, depending on architecture)
    // For now we assume initialProps are only for mounting.

    // Fetch Refs
    const { data: refs = [], error: refsError } = useQuery({
        queryKey: selectedPromptId ? queryKeys.refs(selectedPromptId) : [],
        queryFn: () => fetchRefs(selectedPromptId, 0, 50, { suppressNotification: true, suppressAlert: true }),
        enabled: !!selectedPromptId,
    });

    // Fetch Additional Inputs
    const { data: additionalInputs = [] } = useQuery({
        queryKey: selectedPromptId && selectedRefId ? queryKeys.additionalInputs(selectedPromptId, Number(selectedRefId)) : [],
        queryFn: () => fetchAdditionalInputs(selectedPromptId, Number(selectedRefId), 0, 100, { suppressNotification: true, suppressAlert: true }),
        enabled: !!selectedPromptId && !!selectedRefId,
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Spoiler maxHeight={200} showLabel="Show more" hideLabel="Hide">
                <CompactExecutePanel
                    ref={ref}
                    workspaceId={workspaceId}
                    prompts={prompts}
                    promptsError={promptsError}
                    selectedPromptId={selectedPromptId}
                    onPromptChange={setSelectedPromptId}
                    refs={refs}
                    refsError={refsError}
                    selectedRefId={selectedRefId}
                    onRefChange={setSelectedRefId}
                    models={models}
                    modelsError={modelsError}
                    selectedModelId={selectedModelId}
                    onModelChange={setSelectedModelId}
                    apiKeys={apiKeys}
                    apiKeysError={apiKeysError}
                    selectedApiKeyId={selectedApiKeyId}
                    onApiKeyChange={setSelectedApiKeyId}
                    vendors={vendors}
                    vendorsError={vendorsError}
                    vendorId={selectedVendorId ?? undefined}
                    onVendorChange={setSelectedVendorId}
                    defaultOptions={defaultOptions}
                    additionalInputs={additionalInputs}
                    workspaceDefaultModelId={workspaceDefaultModelId}
                    onExecute={(values) => execute(values)}
                    initialOverrideInstructions={initialOverrideInstructions}
                    onRemoveColumn={onRemove}
                    onValuesChange={onValuesChange}
                />
            </Spoiler>
            <div style={{ marginTop: 16, flex: 1, minHeight: 0, overflow: "auto" }}>
                <OutputPanel
                    workspaceId={workspaceId}
                    blocks={outputBlocks}
                    callId={callId}
                    errorMessage={outputError}
                    isStreaming={isStreaming}
                    isCancelled={isCancelled}
                />
            </div>
        </div>
    );
});
