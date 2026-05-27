import React from "react";
import { useMutation } from "@tanstack/react-query";
import { executeCallStream, fetchLog, LlmStreamEvent, cancelCall } from "@/lib/api/llmCalls";
import { type OutputBlock } from "./OutputPanel";

type UsePlaygroundExecutionProps = {
    workspaceId: string;
};

type OutputKind = OutputBlock["kind"];

type OutputPartState = {
    text: string;
    firstDeltaAt?: number;
    doneAt?: number;
};

type OutputItemState = {
    kind: OutputKind;
    parts: Map<string, OutputPartState>;
};

type OutputItemsState = {
    idToIndex: Map<string, number>;
    indexToItem: Map<number, OutputItemState>;
    nextIndex: number;
    functionCallCount: number;
};

type FunctionCallDoneEvent = Extract<LlmStreamEvent, { type: "response.function_call.done" }>;

function formatJsonLike(value?: unknown) {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") {
        return JSON.stringify(value, null, 2);
    }
    if (!value) return "";
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
}

function formatFunctionCall(event: FunctionCallDoneEvent) {
    const lines = [`Tool: ${event.toolName}`];
    if (event.callId) lines.push(`Call ID: ${event.callId}`);
    if (event.sequence !== undefined && event.sequence !== null) lines.push(`Sequence: ${event.sequence}`);
    if (event.delivery) lines.push(`Delivery: ${event.delivery}`);
    if (event.argumentsJson !== undefined && event.argumentsJson !== null) {
        lines.push("", "Arguments:", formatJsonLike(event.argumentsJson));
    }
    if (event.output !== undefined && event.output !== null) {
        lines.push("", "Output:", formatJsonLike(event.output));
    }
    if (event.errorMessage) {
        lines.push("", "Error:", event.errorMessage);
    }
    return lines.join("\n");
}

function nextFunctionIndex(state: OutputItemsState) {
    const outputIndexes = Array.from(state.indexToItem.entries())
        .filter(([, item]) => item.kind !== "function")
        .map(([index]) => index);
    const latestOutputIndex = outputIndexes.length ? Math.max(...outputIndexes) : -1;
    const index = latestOutputIndex + 0.5 + state.functionCallCount / 1000;
    state.functionCallCount += 1;
    return index;
}

export function usePlaygroundExecution({ workspaceId }: UsePlaygroundExecutionProps) {
    const [outputBlocks, setOutputBlocks] = React.useState<OutputBlock[]>([]);
    const [callId, setCallId] = React.useState<string>("");
    const [outputError, setOutputError] = React.useState<string>("");
    const [isCancelled, setIsCancelled] = React.useState<boolean>(false);

    const callIdRef = React.useRef<string>("");
    const requestStartedAtRef = React.useRef<number>(0);
    const outputItemsRef = React.useRef<OutputItemsState>({
        idToIndex: new Map(),
        indexToItem: new Map(),
        nextIndex: 0,
        functionCallCount: 0,
    });

    const resetOutputState = React.useCallback(() => {
        outputItemsRef.current = {
            idToIndex: new Map(),
            indexToItem: new Map(),
            nextIndex: 0,
            functionCallCount: 0,
        };
        requestStartedAtRef.current = Date.now();
        setOutputBlocks([]);
        setCallId("");
        callIdRef.current = "";
        setOutputError("");
        setIsCancelled(false);
    }, []);

    const ensureIndexForId = React.useCallback(
        (id?: string, index?: number | null, kind: OutputKind = "message") => {
            const state = outputItemsRef.current;
            if (!id) {
                if (typeof index === "number") {
                    if (!state.indexToItem.has(index)) {
                        state.indexToItem.set(index, { kind, parts: new Map() });
                    }
                }
                return index ?? null;
            }
            if (state.idToIndex.has(id)) {
                return state.idToIndex.get(id) ?? null;
            }
            const resolvedIndex = typeof index === "number" ? index : state.nextIndex;
            state.idToIndex.set(id, resolvedIndex);
            if (!state.indexToItem.has(resolvedIndex)) {
                state.indexToItem.set(resolvedIndex, { kind, parts: new Map() });
            }
            state.nextIndex = Math.max(state.nextIndex, resolvedIndex + 1);
            return resolvedIndex;
        },
        [],
    );

    const rebuildOutputBlocks = React.useCallback(() => {
        const entries = Array.from(outputItemsRef.current.indexToItem.entries()).sort(
            ([a], [b]) => a - b,
        );
        const blocks: OutputBlock[] = entries.map(([index, item]) => {
            const parts = Array.from(item.parts.entries()).map(([partKey, partData]) => ({
                part: partKey,
                text: partData.text,
                firstDeltaMs:
                    partData.firstDeltaAt && requestStartedAtRef.current
                        ? partData.firstDeltaAt - requestStartedAtRef.current
                        : undefined,
                doneMs:
                    partData.doneAt && requestStartedAtRef.current
                        ? partData.doneAt - requestStartedAtRef.current
                        : undefined,
            }));

            parts.sort((a, b) => {
                const getPriority = (key: string) => {
                    if (key.startsWith("summary-")) return 1;
                    if (key.startsWith("part-")) return 2;
                    if (key.startsWith("function-")) return 3;
                    return 3;
                };

                const pA = getPriority(a.part);
                const pB = getPriority(b.part);
                if (pA !== pB) return pA - pB;

                return a.part.localeCompare(b.part);
            });

            return {
                index,
                kind: item.kind,
                parts,
            };
        });
        setOutputBlocks(blocks);
    }, []);

    const resolveErrorMessage = React.useCallback((error: unknown) => {
        if (!error) return "요청 중 문제가 발생했습니다.";
        if (typeof error === "string") return error;
        if (typeof error === "object" && "message" in error) {
            const message = (error as { message?: string }).message;
            if (message) return message;
        }
        return "요청 중 문제가 발생했습니다.";
    }, []);

    const executeMutation = useMutation({
        mutationFn: async (payload: {
            refId?: number;
            instructions?: string;
            modelId: string;
            apiKeyId: string;
            inputItems: { role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER"; message: string }[];
            overrideOptions?: {
                temperature?: number;
                topP?: number;
                maxTokens?: number;
                textFormat?: string;
                effort?: string;
                verbosity?: string;
                summary?: string;
                topK?: number;
                includeThoughts?: boolean;
            };
        }) => {
            resetOutputState();
            return executeCallStream(
                {
                    workspaceId: workspaceId || "",
                    llmModelId: Number(payload.modelId),
                    llmApiKeyId: payload.apiKeyId,
                    promptRefId: payload.refId,
                    rawInstructionsText: payload.instructions,
                    inputItems: payload.inputItems,
                    overrideOptions: payload.overrideOptions,
                },
                {
                    onEvent: (event: LlmStreamEvent) => {
                        if (event.type === "log.created") {
                            callIdRef.current = event.logId;
                            setCallId(event.logId);
                            return;
                        }
                        if (event.type === "response.function_call.done") {
                            const state = outputItemsRef.current;
                            const index = nextFunctionIndex(state);
                            const now = Date.now();
                            state.indexToItem.set(index, {
                                kind: "function",
                                parts: new Map([
                                    [
                                        `function-${state.functionCallCount}`,
                                        {
                                            text: formatFunctionCall(event),
                                            firstDeltaAt: now,
                                            doneAt: now,
                                        },
                                    ],
                                ]),
                            });
                            rebuildOutputBlocks();
                        }

                        if (event.type === "response.message.added") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "message");
                            if (typeof index === "number") {
                                rebuildOutputBlocks();
                            }
                        }

                        if (event.type === "response.reasoning.added") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "reasoning");
                            if (typeof index === "number") {
                                rebuildOutputBlocks();
                            }
                        }

                        if (event.type === "response.message.content_part.added") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "message");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `part-${event.partIndex}`;
                                    if (!item.parts.has(partKey)) {
                                        item.parts.set(partKey, { text: "" });
                                    }
                                }
                                rebuildOutputBlocks();
                            }
                        }

                        if (event.type === "response.reasoning.summary_part.added") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "reasoning");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `summary-${event.partIndex}`;
                                    if (!item.parts.has(partKey)) {
                                        item.parts.set(partKey, { text: "" });
                                    }
                                }
                                rebuildOutputBlocks();
                            }
                        }

                        if (event.type === "response.message.delta") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "message");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `part-${event.partIndex}`;
                                    const part = item.parts.get(partKey) || { text: "" };
                                    const now = Date.now();
                                    part.text += event.delta;
                                    part.firstDeltaAt = part.firstDeltaAt ?? now;
                                    item.parts.set(partKey, part);
                                    rebuildOutputBlocks();
                                }
                            }
                        }

                        if (event.type === "response.reasoning.delta") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "reasoning");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `summary-${event.partIndex}`;
                                    const part = item.parts.get(partKey) || { text: "" };
                                    const now = Date.now();
                                    part.text += event.delta;
                                    part.firstDeltaAt = part.firstDeltaAt ?? now;
                                    item.parts.set(partKey, part);
                                    rebuildOutputBlocks();
                                }
                            }
                        }

                        if (event.type === "response.message.content_part.done") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "message");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `part-${event.partIndex}`;
                                    const part = item.parts.get(partKey) || { text: "" };
                                    part.text = event.text ?? part.text;
                                    part.doneAt = Date.now();
                                    item.parts.set(partKey, part);
                                    rebuildOutputBlocks();
                                }
                            }
                        }

                        if (event.type === "response.reasoning.summary_part.done") {
                            const index = ensureIndexForId(event.itemId, event.itemIndex, "reasoning");
                            if (typeof index === "number") {
                                const item = outputItemsRef.current.indexToItem.get(index);
                                if (item) {
                                    const partKey = `summary-${event.partIndex}`;
                                    const part = item.parts.get(partKey) || { text: "" };
                                    part.text = event.text;
                                    part.doneAt = Date.now();
                                    item.parts.set(partKey, part);
                                    rebuildOutputBlocks();
                                }
                            }
                        }

                    },
                    onError: (error) => {
                        setOutputError(resolveErrorMessage(error));
                    },
                    onComplete: async () => {
                        const id = callIdRef.current;
                        if (!id) return;
                        try {
                            if (outputItemsRef.current.indexToItem.size > 0) {
                                return;
                            }

                            const detail = await fetchLog(id);

                            const items = (detail.outputItems ?? [])
                                .slice()
                                .sort((a, b) => a.position - b.position);
                            if (!items.length) return;

                            items.forEach((item, itemIndex) => {
                                const index = itemIndex; // Simple mapping for fallback
                                const map = new Map();

                                const category = item.itemType === "REASONING" ? "reasoning" : "message";

                                if (item.parts && item.parts.length > 0) {
                                    item.parts.forEach((p) => {
                                        const prefix = category === "reasoning" ? "summary-" : "part-";
                                        const key = `${prefix}${p.partIndex}`;
                                        map.set(key, { text: p.text, doneAt: Date.now() });
                                    });
                                }

                                outputItemsRef.current.indexToItem.set(index, {
                                    kind: category,
                                    parts: map,
                                });
                            });
                            rebuildOutputBlocks();
                        } catch {
                            // ignore
                        }
                    },
                },
            );
        },
        onError: (error) => {
            setOutputError(resolveErrorMessage(error));
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async (callLogId: string) => {
            return cancelCall(callLogId, "User cancelled from Playground");
        },
        onSuccess: () => {
            setIsCancelled(true);
        },
    });

    const handleStop = React.useCallback(() => {
        if (callIdRef.current) {
            cancelMutation.mutate(callIdRef.current);
        }
    }, [cancelMutation]);

    return {
        outputBlocks,
        callId,
        outputError,
        isStreaming: executeMutation.isPending,
        isCancelled,
        execute: executeMutation.mutate,
        stop: handleStop,
        isStopping: cancelMutation.isPending,
    };
}
