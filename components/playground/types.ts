export type InputItemForm = {
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
};

export type ExecuteFormValues = {
    promptId: string;
    refId: string;
    instructions: string;
    modelId: string;
    apiKeyId: string;
    inputItems: InputItemForm[];
    overrideOptions: {
        temperature: number | null;
        topP: number | null;
        topK: number | null;
        includeThoughts: boolean | null;
        maxTokens: number | null;
        textFormat: string;
        effort: string;
        verbosity: string;
        summary: string;
    };
};
