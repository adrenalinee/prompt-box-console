"use client";

import React from "react";
import { Alert, Loader, Stack, Text } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchLog } from "@/lib/api/llmCalls";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsLogDetailRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const callId = params?.callId as string;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.log(callId),
        queryFn: () => fetchLog(callId),
        enabled: !!callId,
    });

    React.useEffect(() => {
        const workspaceId = data?.callLog?.workspaceId;
        if (!workspaceId || !callId) return;
        router.replace(`/workspaces/${workspaceId}/logs/${callId}`);
    }, [data?.callLog?.workspaceId, callId, router]);

    if (isLoading) {
        return <Loader />;
    }

    if (isError) {
        return (
            <Alert color="red" title="오류">
                {error && typeof error === "object" && "message" in error
                    ? String((error as { message?: string }).message)
                    : "요청에 실패했습니다."}
            </Alert>
        );
    }

    return (
        <Stack>
            <Text c="dimmed">워크스페이스 상세 화면으로 이동 중...</Text>
        </Stack>
    );
}

