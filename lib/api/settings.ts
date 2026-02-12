import { apiFetch, ApiFetchConfig, PageResponse } from "@/lib/api/client";

export type ApiKey = {
    id: string;
    workspaceId?: string;
    vendorId: string;
    name?: string;
    description?: string;
};

export type Model = {
    id: number;
    vendorId: string;
    name?: string;
    modelKey: string;
    modelType?: "STANDARD" | "REASONING" | "UNKNOWN";
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

export async function createApiKey(
    payload: {
        workspaceId: string;
        vendorId: string;
        name?: string;
        value: string;
        description?: string;
    },
) {
    return apiFetch<ApiKey>(`/llm-api-keys`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchApiKey(apiKeyId: string) {
    return apiFetch<ApiKey>(`/llm-api-keys/${apiKeyId}`);
}

export async function updateApiKey(
    apiKeyId: string,
    payload: {
        workspaceId?: string;
        vendorId?: string;
        name?: string;
        value?: string;
        description?: string;
    },
) {
    return apiFetch<ApiKey>(`/llm-api-keys/${apiKeyId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteApiKey(apiKeyId: string) {
    return apiFetch<void>(`/llm-api-keys/${apiKeyId}`, {
        method: "DELETE",
    });
}

export async function fetchVendors(
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (name) params.set("name", name);
    if (sort) params.set("sort", sort);
    const response = await apiFetch<PageResponse<Vendor>>(
        `/llm-vendors?${params.toString()}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchVendorsPage(
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (name) params.set("name", name);
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Vendor>>(`/llm-vendors?${params.toString()}`, {}, config);
}

export async function createVendor(payload: { name: string; description?: string }) {
    return apiFetch<Vendor>(`/llm-vendors`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchVendor(vendorId: string) {
    return apiFetch<Vendor>(`/llm-vendors/${vendorId}`);
}

export async function updateVendor(
    vendorId: string,
    payload: { name?: string; description?: string },
) {
    return apiFetch<Vendor>(`/llm-vendors/${vendorId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteVendor(vendorId: string) {
    return apiFetch<void>(`/llm-vendors/${vendorId}`, {
        method: "DELETE",
    });
}

export async function fetchWorkspaceApiKeys(
    workspaceId: string,
    vendorId?: string,
    page = 0,
    size = 50,
    config?: ApiFetchConfig,
) {
    const response = await apiFetch<PageResponse<ApiKey>>(
        `/workspaces/${workspaceId}/llm-api-keys?page=${page}&size=${size}${vendorId ? `&vendorId=${vendorId}` : ""
        }`,
        {},
        config,
    );
    return response.items;
}

export async function fetchWorkspaceApiKeysPage(
    workspaceId: string,
    vendorId?: string,
    name?: string,
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (vendorId) params.set("vendorId", vendorId);
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<ApiKey>>(
        `/workspaces/${workspaceId}/llm-api-keys?${params.toString()}`,
        {},
        config,
    );
}

export async function fetchApiKeys(
    filters: { workspaceId?: string; vendorId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.vendorId) params.set("vendorId", filters.vendorId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<ApiKey>>(
        `/llm-api-keys?${params.toString()}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchApiKeysPage(
    filters: { workspaceId?: string; vendorId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.vendorId) params.set("vendorId", filters.vendorId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<ApiKey>>(`/llm-api-keys?${params.toString()}`, {}, config);
}

export async function fetchModels(
    vendorId?: string,
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (vendorId) params.set("vendorId", vendorId);
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<Model>>(
        `/models?${params.toString()}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchModelsPage(
    vendorId?: string,
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (vendorId) params.set("vendorId", vendorId);
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Model>>(`/models?${params.toString()}`, {}, config);
}

export async function fetchModel(modelId: number) {
    return apiFetch<Model>(`/models/${modelId}`);
}

export async function updateModel(
    modelId: number,
    payload: {
        vendorId?: string;
        name?: string;
        modelKey?: string;
        modelType?: "STANDARD" | "REASONING" | "UNKNOWN";
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        description?: string;
    },
) {
    return apiFetch<Model>(`/models/${modelId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteModel(modelId: number) {
    return apiFetch<void>(`/models/${modelId}`, {
        method: "DELETE",
    });
}

export async function fetchWorkspaceModels(
    workspaceId: string,
    vendorId?: string,
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (vendorId) params.set("vendorId", vendorId);
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<Model>>(
        `/workspaces/${workspaceId}/models?${params.toString()}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchWorkspaceModelsPage(
    workspaceId: string,
    vendorId?: string,
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (vendorId) params.set("vendorId", vendorId);
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Model>>(
        `/workspaces/${workspaceId}/models?${params.toString()}`,
        {},
        config,
    );
}

export async function createModel(payload: {
    vendorId: string;
    name: string;
    modelKey: string;
    modelType: "STANDARD" | "REASONING" | "UNKNOWN";
    contextWindow?: number;
    inputPrice?: number;
    outputPrice?: number;
    description?: string;
}) {
    return apiFetch<Model>(`/models`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
