"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchWorkspaces, Workspace } from "@/lib/api/workspaces";

type WorkspaceContextValue = {
    workspaceId: string | null;
    workspaces: Workspace[];
    setWorkspaceId: (id: string) => void;
    isLoading: boolean;
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: () => fetchWorkspaces(0, 100),
    });

    React.useEffect(() => {
        if (!workspaceId && data && data.length > 0) {
            setWorkspaceId(data[0].id);
        }
    }, [data, workspaceId]);

    const value = React.useMemo(
        () => ({
            workspaceId,
            workspaces: data ?? [],
            setWorkspaceId,
            isLoading,
        }),
        [workspaceId, data, isLoading],
    );

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
    const context = React.useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within WorkspaceProvider");
    }
    return context;
}
