'use client';

import React from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themeOverride } from '@/app/theme';
import {CodeHighlightAdapterProvider, createShikiAdapter} from "@mantine/code-highlight";

const theme = createTheme(themeOverride);

async function loadShiki() {
    const { createHighlighter } = await import('shiki');
    const shiki = await createHighlighter({
        langs: ['tsx', 'scss', 'html', 'bash', 'json'],
        // You can load supported themes here
        themes: [],
    });

    return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);


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
                <CodeHighlightAdapterProvider adapter={shikiAdapter}>
                    <ModalsProvider>
                        <Notifications position="top-right" />
                        {children}
                    </ModalsProvider>
                </CodeHighlightAdapterProvider>
            </MantineProvider>
        </QueryClientProvider>
    );
}
