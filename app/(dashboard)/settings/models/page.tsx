"use client";

import React from "react";
import { Loader, Select, Stack, Table, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { fetchModels, fetchVendors } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

export default function ModelsPage() {
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

    const { data: models = [], isLoading } = useQuery({
        queryKey: vendorId ? queryKeys.models(vendorId) : [],
        queryFn: () => fetchModels(vendorId || ""),
        enabled: !!vendorId,
    });

    const vendorOptions = vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
    }));

    return (
        <Stack>
            <Text fw={700} size="xl">
                Models
            </Text>
            <Select
                label="Vendor"
                placeholder="Vendor 선택"
                data={vendorOptions}
                value={vendorId}
                onChange={setVendorId}
                clearable
            />
            {isLoading ? (
                <Loader />
            ) : models.length === 0 ? (
                <Text c="dimmed">등록된 모델이 없습니다.</Text>
            ) : (
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Model Key</Table.Th>
                            <Table.Th>Description</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {models.map((model) => (
                            <Table.Tr key={model.id}>
                                <Table.Td>{model.name ?? "-"}</Table.Td>
                                <Table.Td>{model.modelKey}</Table.Td>
                                <Table.Td>{model.description ?? "-"}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
}
