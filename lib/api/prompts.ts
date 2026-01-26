import { apiFetch, ApiFetchConfig, PageResponse } from "@/lib/api/client";

export type Prompt = {
    id: string;
    name: string;
    description?: string;
    workspaceId?: string;
    defaultBranchRefId?: number;
    latestTagRefId?: number;
};

export type PromptDetail = Prompt;

export type AdditionalInput = {
    position: number;
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
};

export type PromptRef = {
    id: number;
    promptId: string;
    name: string;
    type: "BRANCH" | "TAG";
    instructions: string;
    description?: string;
};

export type AdditionalInputItem = {
    id: number;
    position: number;
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
};

export async function fetchPrompts(
    workspaceId: string,
    page = 0,
    size = 50,
    config?: ApiFetchConfig,
) {
    const response = await apiFetch<PageResponse<Prompt>>(
        `/workspaces/${workspaceId}/prompts?page=${page}&size=${size}`,
        {},
        config,
    );
    return response.items;
}

export async function fetchPromptsPage(
    workspaceId: string,
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
    return apiFetch<PageResponse<Prompt>>(
        `/workspaces/${workspaceId}/prompts?${params.toString()}`,
        {},
        config,
    );
}

export async function fetchAllPrompts(
    filters: { workspaceId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<Prompt>>(`/prompts?${params.toString()}`);
    return response.items;
}

export async function fetchAllPromptsPage(
    filters: { workspaceId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Prompt>>(`/prompts?${params.toString()}`, {}, config);
}

export async function createPrompt(
    workspaceId: string,
    payload: {
        name: string;
        instructions: string;
        description?: string;
        mainRefName?: string;
        additionalInputs?: AdditionalInput[];
    },
) {
    const mainRefName = payload.mainRefName?.trim() || "main";
    const additionalInputs = payload.additionalInputs ?? [];
    return apiFetch<Prompt>(`/prompts`, {
        method: "POST",
        body: JSON.stringify({
            ...payload,
            workspaceId,
            mainRefName,
            additionalInputs,
        }),
    });
}

export async function fetchPrompt(promptId: string) {
    return apiFetch<PromptDetail>(`/prompts/${promptId}`);
}

export async function updatePrompt(
    promptId: string,
    payload: { name?: string; description?: string },
) {
    return apiFetch<PromptDetail>(`/prompts/${promptId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deletePrompt(promptId: string) {
    return apiFetch<void>(`/prompts/${promptId}`, {
        method: "DELETE",
    });
}

export async function fetchRefs(
    promptId: string,
    page = 0,
    size = 50,
    config?: ApiFetchConfig,
) {
    const response = await apiFetch<PageResponse<PromptRef>>(
        `/prompts/${promptId}/refs?page=${page}&size=${size}`,
        {},
        config,
    );
    return response.items;
}

export async function createRef(
    promptId: string,
    payload: { name: string; type: "BRANCH" | "TAG"; fromRefId: number; description?: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateRef(
    promptId: string,
    refId: number,
    payload: { name?: string; description?: string; instructions?: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs/${refId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteRef(promptId: string, refId: number) {
    return apiFetch<void>(`/prompts/${promptId}/refs/${refId}`, {
        method: "DELETE",
    });
}

export async function fetchAdditionalInputs(
    promptId: string,
    refId: number,
    page = 0,
    size = 50,
    config?: ApiFetchConfig,
) {
    const response = await apiFetch<PageResponse<AdditionalInputItem>>(
        `/prompts/${promptId}/refs/${refId}/additional-input-items?page=${page}&size=${size}`,
        {},
        config,
    );
    return response.items;
}

export async function addAdditionalInput(
    promptId: string,
    refId: number,
    payload: { position?: number; role: AdditionalInputItem["role"]; message: string },
) {
    return apiFetch<AdditionalInputItem>(
        `/prompts/${promptId}/refs/${refId}/additional-input-items`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );
}

export async function updateAdditionalInput(
    promptId: string,
    refId: number,
    additionalInputItemId: number,
    payload: { position?: number; role: AdditionalInputItem["role"]; message: string },
) {
    return apiFetch<AdditionalInputItem>(
        `/prompts/${promptId}/refs/${refId}/additional-input-items/${additionalInputItemId}`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
    );
}

export async function deleteAdditionalInput(
    promptId: string,
    refId: number,
    additionalInputItemId: number,
) {
    return apiFetch<void>(
        `/prompts/${promptId}/refs/${refId}/additional-input-items/${additionalInputItemId}`,
        {
            method: "DELETE",
        },
    );
}
