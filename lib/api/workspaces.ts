import { apiFetch, ApiFetchConfig, PageResponse } from "@/lib/api/client";

export type Workspace = {
    id: string;
    name: string;
    description?: string;
    defaultModelId?: number;
};

export type DefaultOptions = {
    workspaceId: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    textFormat?: string;
    effort?: "DEFAULT" | "LOW" | "MEDIUM" | "HIGH";
    verbosity?: "LOW" | "MEDIUM" | "HIGH";
    summary?: "AUTO" | "CONCISE" | "DETAILED";
};

export type WorkspaceDetail = Workspace & {
    defaultLlmCallOptions?: DefaultOptions;
};

export async function fetchWorkspaces(
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
    const response = await apiFetch<PageResponse<Workspace>>(
        `/workspaces?${params.toString()}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchWorkspacesPage(
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
    return apiFetch<PageResponse<Workspace>>(`/workspaces?${params.toString()}`, {}, config);
}

export async function createWorkspace(payload: { name: string; description?: string }) {
    return apiFetch<Workspace>(`/workspaces`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchWorkspace(workspaceId: string, includeDefaultOptions = false) {
    const params = new URLSearchParams();
    if (includeDefaultOptions) {
        params.set("includeDefaultOptions", "true");
    }
    const query = params.toString();
    return apiFetch<WorkspaceDetail>(`/workspaces/${workspaceId}${query ? `?${query}` : ""}`);
}

export async function updateWorkspace(
    workspaceId: string,
    payload: { name?: string; description?: string; defaultModelId?: number | null },
) {
    return apiFetch<Workspace>(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteWorkspace(workspaceId: string) {
    return apiFetch<void>(`/workspaces/${workspaceId}`, {
        method: "DELETE",
    });
}

export async function fetchDefaultOptions(workspaceId: string) {
    try {
        return await apiFetch<DefaultOptions>(
            `/workspaces/${workspaceId}/default-options`,
            {},
            { suppressNotification: true, suppressAlert: true },
        );
    } catch (error) {
        if (typeof error === "object" && error && "status" in error) {
            const status = (error as { status?: number }).status;
            if (status === 404) {
                return null;
            }
        }
        throw error;
    }
}

export async function upsertDefaultOptions(
    workspaceId: string,
    payload: Omit<DefaultOptions, "workspaceId">,
) {
    return apiFetch<DefaultOptions>(`/workspaces/${workspaceId}/default-options`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
