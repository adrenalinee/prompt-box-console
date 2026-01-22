"use client";

import React from "react";
import { Group, Loader, Select, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/workspace/context";
import { fetchLogs } from "@/lib/api/llmCalls";
import { fetchModels, fetchVendors } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";
import { LogTable } from "@/components/logs/LogTable";

export default function LogsPage() {
    const { workspaceId, isLoading: workspaceLoading } = useWorkspace();
    const [modelId, setModelId] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<string | null>(null);
    const [vendorId, setVendorId] = React.useState<string | null>(null);

    const { data: vendors = [] } = useQuery({
        queryKey: ["vendors"],
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

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    const modelOptions = models.map((model) => ({
        value: String(model.id),
        label: `${model.modelKey}`,
    }));

    if (workspaceLoading) {
        return <Loader />;
    }

    return (
        <Stack>
            <Text fw={700} size="xl">
                Logs
            </Text>
            <Group grow>
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
            ) : logs.length === 0 ? (
                <Text c="dimmed">로그가 없습니다.</Text>
            ) : (
                <LogTable logs={logs} />
            )}
        </Stack>
    );
}
