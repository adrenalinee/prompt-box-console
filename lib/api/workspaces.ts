import { apiFetch, PageResponse } from "@/lib/api/client";

export type Workspace = {
    id: string;
    name: string;
    description?: string;
};

export async function fetchWorkspaces(page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Workspace>>(
        `/workspaces?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function createWorkspace(payload: { name: string; description?: string }) {
    return apiFetch<Workspace>(`/workspaces`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
