import { apiFetch, PageResponse } from "@/lib/api/client";

export type ApiKey = {
    id: string;
    vendorId: string;
    name?: string;
    description?: string;
};

export type Model = {
    id: string;
    vendorId: string;
    name?: string;
    modelKey: string;
    contextWindow?: number;
    inputPrice?: number;
    outputPrice?: number;
    description?: string;
};

export type Vendor = {
    id: string;
    name: string;
    description?: string;
};

export async function fetchApiKeys(workspaceId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<ApiKey>>(
        `/workspaces/${workspaceId}/llm-api-keys?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function createApiKey(
    workspaceId: string,
    payload: { vendorId: string; name?: string; value: string; description?: string },
) {
    return apiFetch<ApiKey>(`/workspaces/${workspaceId}/llm-api-keys`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchVendors(page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Vendor>>(
        `/llm-vendors?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function createVendor(payload: { name: string; description?: string }) {
    return apiFetch<Vendor>(`/llm-vendors`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchModels(vendorId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Model>>(
        `/llm-vendors/${vendorId}/models?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function createModel(
    vendorId: string,
    payload: {
        name: string;
        modelKey: string;
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        description?: string;
    },
) {
    return apiFetch<Model>(`/llm-vendors/${vendorId}/models`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
