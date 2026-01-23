'use client';

import React from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themeOverride } from '@/app/theme';

const theme = createTheme(themeOverride);

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: 1, refetchOnWindowFocus: false },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} defaultColorScheme="light">
                <ModalsProvider>
                    <Notifications position="top-right" />
                    {children}
                </ModalsProvider>
            </MantineProvider>
        </QueryClientProvider>
    );
}
