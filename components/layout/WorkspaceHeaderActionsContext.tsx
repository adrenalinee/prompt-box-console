"use client";

import React from "react";
import { Group } from "@mantine/core";

type WorkspaceHeaderActionsContextValue = {
    setActions: (actions: React.ReactNode) => void;
};

const WorkspaceHeaderActionsStateContext = React.createContext<React.ReactNode>(null);
const WorkspaceHeaderActionsContext = React.createContext<WorkspaceHeaderActionsContextValue | null>(
    null,
);

export function WorkspaceHeaderActionsProvider({ children }: { children: React.ReactNode }) {
    const [actions, setActions] = React.useState<React.ReactNode>(null);
    const updateActions = React.useCallback((nextActions: React.ReactNode) => {
        setActions(nextActions);
    }, []);

    const value = React.useMemo(
        () => ({
            setActions: updateActions,
        }),
        [updateActions],
    );

    return (
        <WorkspaceHeaderActionsContext.Provider value={value}>
            <WorkspaceHeaderActionsStateContext.Provider value={actions}>
                {children}
            </WorkspaceHeaderActionsStateContext.Provider>
        </WorkspaceHeaderActionsContext.Provider>
    );
}

export function WorkspaceHeaderPageActionsSlot() {
    const actions = React.useContext(WorkspaceHeaderActionsStateContext);

    if (!actions) {
        return null;
    }

    return <Group gap="xs">{actions}</Group>;
}

export function useWorkspaceHeaderPageActions(actions: React.ReactNode) {
    const context = React.useContext(WorkspaceHeaderActionsContext);

    React.useEffect(() => {
        if (!context) return;

        context.setActions(actions);

        return () => {
            context.setActions(null);
        };
    }, [actions, context]);
}
