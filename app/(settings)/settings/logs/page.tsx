"use client";

import React from "react";
import { Group, Loader, Select, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { fetchLogs } from "@/lib/api/llmCalls";
import { fetchModels, fetchVendors } from "@/lib/api/settings";
import { fetchWorkspaces } from "@/lib/api/workspaces";
import { queryKeys } from "@/lib/query/keys";
import { LogTable } from "@/components/logs/LogTable";

export default function SettingsLogsPage() {
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
    const [modelId, setModelId] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<string | null>(null);
    const [vendorId, setVendorId] = React.useState<string | null>(null);

    const { data: workspaces = [], isLoading: workspaceLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(),
    });

    React.useEffect(() => {
        if (!workspaceId && workspaces.length > 0) {
            setWorkspaceId(workspaces[0].id);
        }
    }, [workspaces, workspaceId]);

    const { data: vendors = [] } = useQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => fetchVendors(),
    });

    React.useEffect(() => {
        if (!vendorId && vendors.length > 0) {
            setVendorId(vendors[0].id);
        }
    }, [vendors, vendorId]);

    React.useEffect(() => {
        setModelId(null);
    }, [vendorId]);

    const { data: models = [] } = useQuery({
        queryKey: vendorId ? queryKeys.models(vendorId) : [],
        queryFn: () => fetchModels(vendorId || ""),
        enabled: !!vendorId,
    });

    const filters = React.useMemo(
        () => ({
            modelId,
            status,
        }),
        [modelId, status],
    );

    const { data: logs = [], isLoading } = useQuery({
        queryKey: workspaceId ? queryKeys.logs(workspaceId, filters) : [],
        queryFn: () => fetchLogs(workspaceId || "", filters),
        enabled: !!workspaceId,
    });

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }));

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${model.modelKey}`,
    }));

    return (
        <Stack>
            <Text fw={700} size="xl">
                Logs
            </Text>
            <Group grow>
                <Select
                    label="Workspace"
                    placeholder="Workspace 선택"
                    data={workspaceOptions}
                    value={workspaceId}
                    onChange={setWorkspaceId}
                    disabled={workspaceLoading}
                />
                <Select
                    label="Vendor"
                    placeholder="전체"
                    data={vendorOptions}
                    value={vendorId}
                    onChange={setVendorId}
                    clearable
                />
                <Select
                    label="Model"
                    placeholder="전체"
                    data={modelOptions}
                    value={modelId}
                    onChange={setModelId}
                    clearable
                />
                <Select
                    label="Status"
                    placeholder="전체"
                    data={[
                        { value: "SUCCESS", label: "SUCCESS" },
                        { value: "ERROR", label: "ERROR" },
                        { value: "TIMEOUT", label: "TIMEOUT" },
                        { value: "CANCELLED", label: "CANCELLED" },
                    ]}
                    value={status}
                    onChange={setStatus}
                    clearable
                />
            </Group>
            {isLoading ? (
                <Loader />
            ) : !workspaceId ? (
                <Text c="dimmed">Workspace를 선택하세요.</Text>
            ) : logs.length === 0 ? (
                <Text c="dimmed">로그가 없습니다.</Text>
            ) : (
                <LogTable logs={logs} workspaceId={workspaceId} />
            )}
        </Stack>
    );
}
