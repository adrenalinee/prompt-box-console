export const queryKeys = {
    workspaces: ["workspaces"] as const,
    prompts: (workspaceId: string) => ["prompts", workspaceId] as const,
    prompt: (promptId: string) => ["prompt", promptId] as const,
    refs: (promptId: string) => ["refs", promptId] as const,
    additionalInputs: (promptId: string, refId: number | null) =>
        ["additionalInputs", promptId, refId ?? "none"] as const,
    logs: (workspaceId: string, filters: Record<string, unknown>) =>
        ["logs", workspaceId, filters] as const,
    logsAll: (filters: Record<string, unknown>) => ["logsAll", filters] as const,
    log: (callId: string) => ["log", callId] as const,
    models: (vendorId?: string | null) => ["models", vendorId ?? "all"] as const,
    workspaceModels: (workspaceId: string, vendorId?: string | null) =>
        ["workspaceModels", workspaceId, vendorId ?? "all"] as const,
    apiKeys: (filters: { workspaceId?: string | null; vendorId?: string | null }) =>
        ["apiKeys", filters.workspaceId ?? "all", filters.vendorId ?? "all"] as const,
    workspaceApiKeys: (workspaceId: string) => ["workspaceApiKeys", workspaceId] as const,
    vendors: ["vendors"] as const,
};
