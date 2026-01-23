import { apiFetch, PageResponse } from "@/lib/api/client";

export type Workspace = {
    id: string;
    name: string;
    description?: string;
};

export async function fetchWorkspaces(page = 0, size = 50, name?: string) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (name) params.set("name", name);
    const response = await apiFetch<PageResponse<Workspace>>(
        `/workspaces?${params.toString()}`,
    );
    return response.items;
}

export async function createWorkspace(payload: { name: string; description?: string }) {
    return apiFetch<Workspace>(`/workspaces`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchWorkspace(workspaceId: string) {
    return apiFetch<Workspace>(`/workspaces/${workspaceId}`);
}

export async function updateWorkspace(
    workspaceId: string,
    payload: { name?: string; description?: string },
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
