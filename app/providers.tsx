'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="auto">
                <ModalsProvider>
                    <Notifications position="top-right" />
                    {children}
                </ModalsProvider>
            </MantineProvider>
        </QueryClientProvider>
    );
}
