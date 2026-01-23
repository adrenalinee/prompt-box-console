"use client";

import React from "react";
import { Loader, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchLog } from "@/lib/api/llmCalls";
import { queryKeys } from "@/lib/query/keys";
import { LogDetail } from "@/components/logs/LogDetail";

export default function LogDetailPage() {
    const params = useParams();
    const callId = params?.callId as string;

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.log(callId),
        queryFn: () => fetchLog(callId),
        enabled: !!callId,
    });

    if (isLoading) {
        return <Loader />;
    }

    if (!data) {
        return <Text c="dimmed">로그를 찾을 수 없습니다.</Text>;
    }

    return <LogDetail log={data} />;
}
