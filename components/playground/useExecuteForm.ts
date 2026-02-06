import React from "react";
import { useForm } from "@mantine/form";
import type { ExecuteFormValues, InputItemForm } from "./types";
import type { AdditionalInputItem, Prompt, PromptRef } from "@/lib/api/prompts";
import type { DefaultOptions } from "@/lib/api/workspaces";

type UseExecuteFormProps = {
    initialPromptId?: string;
    initialRefId?: string;
    initialModelId?: string;
    initialApiKeyId?: string;
    initialOverrideInstructions?: string;
    initialInputItems?: InputItemForm[];
    refs: PromptRef[]; // Changed from selectedRef to refs array
    defaultOptions?: DefaultOptions | null;
    additionalInputs?: AdditionalInputItem[];
    onValuesChange?: (values: ExecuteFormValues) => void;
};

export function useExecuteForm({
    initialPromptId,
    initialRefId,
    initialModelId,
    initialApiKeyId,
    initialOverrideInstructions,
    initialInputItems,
    refs,
    defaultOptions,
    additionalInputs,
    onValuesChange,
}: UseExecuteFormProps) {
    const overrideConsumedRef = React.useRef(false);
    const lastRefIdRef = React.useRef<string | null>(null);
    const [refBaselineInstructions, setRefBaselineInstructions] = React.useState("");
    const [refBaselineInputs, setRefBaselineInputs] = React.useState<InputItemForm[]>([]);

    const form = useForm<ExecuteFormValues>({
        initialValues: {
            promptId: initialPromptId ?? "",
            refId: initialRefId ?? "",
            instructions: "",
            modelId: initialModelId ?? "",
            apiKeyId: initialApiKeyId ?? "",
            inputItems: initialInputItems && initialInputItems.length > 0 ? initialInputItems : [{ role: "USER", message: "" }],
            overrideOptions: {
                temperature: null,
                topP: null,
                maxTokens: null,
                textFormat: "",
                effort: "",
                verbosity: "",
                summary: "",
            },
        },
        onValuesChange,
    });

    const safeRefs = Array.isArray(refs) ? refs : [];
    const selectedRef = safeRefs.find((ref) => String(ref.id) === form.values.refId);

    // Sync form values with Props (for external updates like URL changes or auto-selection)
    React.useEffect(() => {
        if (initialPromptId !== undefined && initialPromptId !== form.values.promptId) {
            form.setFieldValue("promptId", initialPromptId);
        }
    }, [initialPromptId]);

    React.useEffect(() => {
        if (initialRefId !== undefined && initialRefId !== form.values.refId) {
            form.setFieldValue("refId", initialRefId);
        }
    }, [initialRefId]);

    React.useEffect(() => {
        if (initialModelId !== undefined && initialModelId !== form.values.modelId) {
            form.setFieldValue("modelId", initialModelId);
        }
    }, [initialModelId]);

    React.useEffect(() => {
        if (initialApiKeyId !== undefined && initialApiKeyId !== form.values.apiKeyId) {
            form.setFieldValue("apiKeyId", initialApiKeyId);
        }
    }, [initialApiKeyId]);


    const normalizeInputItems = React.useCallback((items: InputItemForm[]) => {
        let next = items.map((item) => ({ ...item }));
        if (next.length === 0) {
            next = [{ role: "USER", message: "" }];
        }
        while (next.length > 1) {
            const last = next[next.length - 1];
            const prev = next[next.length - 2];
            if (last.message.trim() === "" && prev.message.trim() === "") {
                next.pop();
            } else {
                break;
            }
        }
        const last = next[next.length - 1];
        if (last.message.trim() !== "") {
            next.push({ role: "USER", message: "" });
        }
        return next;
    }, []);

    const updateInputMessage = React.useCallback(
        (index: number, value: string) => {
            const items = form.values.inputItems.map((item, idx) =>
                idx === index ? { ...item, message: value } : item,
            );
            if (index === items.length - 1 && value.trim().length > 0) {
                items.push({ role: "USER", message: "" });
            }
            if (index === items.length - 2 && value.trim().length === 0) {
                items.splice(index, 1);
            }
            form.setFieldValue("inputItems", normalizeInputItems(items));
        },
        [form, normalizeInputItems],
    );

    // Sync instructions when Ref changes
    React.useEffect(() => {
        if (!selectedRef) {
            if (!form.values.promptId) {
                setRefBaselineInstructions("");
                form.setFieldValue("instructions", "");
                setRefBaselineInputs([]);
                lastRefIdRef.current = null;
            }
            return;
        }

        const serverInstructions = selectedRef.instructions ?? "";
        const currentRefId = String(selectedRef.id);
        const refChanged = lastRefIdRef.current !== currentRefId;

        // Apply override if available and not yet consumed
        if (initialOverrideInstructions !== undefined && !overrideConsumedRef.current) {
            form.setFieldValue("instructions", initialOverrideInstructions);
            setRefBaselineInstructions(serverInstructions);
            overrideConsumedRef.current = true;
            lastRefIdRef.current = currentRefId;
            return;
        }

        // Standard Sync Logic
        if (refChanged) {
            form.setFieldValue("instructions", serverInstructions);
        } else {
            // Ref updated (same ID). Only update if user hasn't modified it (dirty check).
            if (form.values.instructions === refBaselineInstructions) {
                form.setFieldValue("instructions", serverInstructions);
            }
        }

        setRefBaselineInstructions(serverInstructions);
        lastRefIdRef.current = currentRefId;
    }, [selectedRef?.id, selectedRef?.instructions, initialOverrideInstructions]); // Removed unnecessary deps

    // Sync additional Inputs when Ref changes
    React.useEffect(() => {
        if (!form.values.refId) return;
        if (additionalInputs && additionalInputs.length > 0) {
            const nextItems: InputItemForm[] = additionalInputs.map((item) => ({
                role: item.role as InputItemForm["role"],
                message: item.message,
            }));
            form.setFieldValue("inputItems", normalizeInputItems(nextItems));
            setRefBaselineInputs(nextItems);
        } else {
            const defaultItems: InputItemForm[] = [{ role: "USER", message: "" }];
            form.setFieldValue("inputItems", normalizeInputItems(defaultItems));
            setRefBaselineInputs([]);
        }
    }, [form.values.refId, additionalInputs, normalizeInputItems]);

    // Input normalization effect
    React.useEffect(() => {
        const normalized = normalizeInputItems(form.values.inputItems);
        const current = form.values.inputItems;
        const isSame =
            normalized.length === current.length &&
            normalized.every(
                (item, index) =>
                    item.message === current[index]?.message &&
                    item.role === current[index]?.role,
            );
        if (!isSame) {
            form.setFieldValue("inputItems", normalized);
        }
    }, [form.values.inputItems, normalizeInputItems]);

    // Default Options logic
    React.useEffect(() => {
        if (!defaultOptions && form.values.overrideOptions.temperature !== null) return;
        const fallback = {
            temperature: 1,
            topP: 0,
            maxTokens: 3000,
            textFormat: "",
            effort: "LOW",
            verbosity: "LOW",
            summary: "AUTO",
        };
        form.setFieldValue("overrideOptions.temperature", defaultOptions?.temperature ?? fallback.temperature);
        form.setFieldValue("overrideOptions.topP", defaultOptions?.topP ?? fallback.topP);
        form.setFieldValue("overrideOptions.maxTokens", defaultOptions?.maxTokens ?? fallback.maxTokens);
        form.setFieldValue("overrideOptions.textFormat", defaultOptions?.textFormat ?? fallback.textFormat);
        form.setFieldValue("overrideOptions.effort", defaultOptions?.effort ?? fallback.effort);
        form.setFieldValue("overrideOptions.verbosity", defaultOptions?.verbosity ?? fallback.verbosity);
        form.setFieldValue("overrideOptions.summary", defaultOptions?.summary ?? fallback.summary);
    }, [defaultOptions]);

    const effectiveInputItems = React.useMemo(
        () => form.values.inputItems.filter((item) => item.message.trim().length > 0),
        [form.values.inputItems],
    );

    const hasPromptContent =
        form.values.instructions.trim().length > 0 || effectiveInputItems.length > 0;

    const effectiveBaselineInputs = React.useMemo(
        () => refBaselineInputs.filter((item) => item.message.trim().length > 0),
        [refBaselineInputs]
    );

    const isModified =
        !!form.values.promptId &&
        !!form.values.refId &&
        (form.values.instructions.trim() !== refBaselineInstructions.trim() ||
            JSON.stringify(effectiveInputItems) !== JSON.stringify(effectiveBaselineInputs));

    const hasInvalidInputItems = form.values.inputItems
        .slice(0, -1)
        .some((item) => item.message.trim().length === 0);

    return {
        form,
        normalizeInputItems,
        updateInputMessage,
        effectiveInputItems,
        hasPromptContent,
        isModified,
        hasInvalidInputItems,
        refBaselineInstructions,
        refBaselineInputs,
        setRefBaselineInstructions,
        setRefBaselineInputs,
    };
}
