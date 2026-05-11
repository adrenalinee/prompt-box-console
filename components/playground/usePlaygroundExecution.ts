import React from "react";
import { useMutation } from "@tanstack/react-query";
import { executeCallStream, fetchLog, LlmStreamEvent, cancelCall } from "@/lib/api/llmCalls";
import { type OutputBlock } from "./OutputPanel";

type UsePlaygroundExecutionProps = {
    workspaceId: string;
};

export function usePlaygroundExecution({ workspaceId }: UsePlaygroundExecutionProps) {
    const [outputBlocks, setOutputBlocks] = React.useState<OutputBlock[]>([]);
    const [callId, setCallId] = React.useState<string>("");
    const [outputError, setOutputError] = React.useState<string>("");
    const [isCancelled, setIsCancelled] = React.useState<boolean>(false);

    const callIdRef = React.useRef<string>("");
    const requestStartedAtRef = React.useRef<number>(0);
    const outputItemsRef = React.useRef<{
        idToIndex: Map<string, number>;
        indexToItem: Map<
            number,
            {
                kind: "message" | "reasoning";
                parts: Map<
                    string,
                    {
                        text: string;
                        firstDeltaAt?: number;
                        doneAt?: number;
                    }
                >;
            }
        >;
        nextIndex: number;
    }>({
        idToIndex: new Map(),
        indexToItem: new Map(),
        nextIndex: 0,
    });

    const resetOutputState = React.useCallback(() => {
        outputItemsRef.current = {
            idToIndex: new Map(),
            indexToItem: new Map(),
            nextIndex: 0,
        };
        requestStartedAtRef.current = Date.now();
        setOutputBlocks([]);
        setCallId("");
        callIdRef.current = "";
        setOutputError("");
        setIsCancelled(false);
    }, []);

    const ensureIndexForId = React.useCallback(
        (id?: string, index?: number, kind: "message" | "reasoning" = "message") => {
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
                        if (event.type === "response.created") {

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
                                    part.text = event.text;
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
