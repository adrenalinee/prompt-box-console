import { apiFetch, PageResponse } from "@/lib/api/client";

export type Prompt = {
    id: string;
    name: string;
    description?: string;
    workspaceId?: string;
    latestRefId?: number;
};

export type PromptDetail = Prompt;

export type Snapshot = {
    id: string;
    instructions: string;
    version?: number;
};

export type PromptRef = {
    id: number;
    promptId: string;
    name: string;
    type: "BRANCH" | "TAG";
    promptSnapshotId: string;
    description?: string;
};

export async function fetchPrompts(workspaceId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Prompt>>(
        `/workspaces/${workspaceId}/prompts?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function createPrompt(
    workspaceId: string,
    payload: { name: string; instructions: string; description?: string; mainRefName?: string },
) {
    return apiFetch<Prompt>(`/workspaces/${workspaceId}/prompts`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchPrompt(promptId: string) {
    return apiFetch<PromptDetail>(`/prompts/${promptId}`);
}

export async function fetchSnapshots(promptId: string) {
    return apiFetch<Snapshot[]>(`/prompts/${promptId}/snapshots`);
}

export async function createSnapshot(
    promptId: string,
    payload: { instructions: string; additionalInputs?: unknown[] },
) {
    return apiFetch<Snapshot>(`/prompts/${promptId}/snapshots`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchRefs(promptId: string) {
    return apiFetch<PromptRef[]>(`/prompts/${promptId}/refs`);
}

export async function createRef(
    promptId: string,
    payload: { name: string; type: "BRANCH" | "TAG"; promptSnapshotId: string; description?: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function moveRef(
    promptId: string,
    refId: number,
    payload: { promptSnapshotId: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs/${refId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}
