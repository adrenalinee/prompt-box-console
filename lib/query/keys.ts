export const queryKeys = {
    workspaces: ["workspaces"] as const,
    prompts: (workspaceId: string) => ["prompts", workspaceId] as const,
    prompt: (promptId: string) => ["prompt", promptId] as const,
    snapshots: (promptId: string) => ["snapshots", promptId] as const,
    refs: (promptId: string) => ["refs", promptId] as const,
    logs: (workspaceId: string, filters: Record<string, unknown>) =>
        ["logs", workspaceId, filters] as const,
    log: (callId: string) => ["log", callId] as const,
    models: (workspaceId: string) => ["models", workspaceId] as const,
    apiKeys: (workspaceId: string) => ["apiKeys", workspaceId] as const,
};
