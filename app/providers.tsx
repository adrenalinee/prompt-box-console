'use client';

import React from 'react';
import { Button, Group, Modal, Text, createTheme, MantineProvider } from '@mantine/core';
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
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: 1, refetchOnWindowFocus: false },
                },
            }),
    );

    React.useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ message?: string }>).detail;
            if (detail?.message) {
                setErrorMessage(detail.message);
            }
        };
        window.addEventListener("app-api-error", handler);
        return () => window.removeEventListener("app-api-error", handler);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} defaultColorScheme="light">
                <CodeHighlightAdapterProvider adapter={shikiAdapter}>
                    <ModalsProvider>
                        <Notifications position="top-right" />
                        <Modal
                            opened={!!errorMessage}
                            onClose={() => setErrorMessage(null)}
                            title="오류"
                            centered
                        >
                            <Text>{errorMessage}</Text>
                            <Group justify="flex-end" mt="md">
                                <Button onClick={() => setErrorMessage(null)}>확인</Button>
                            </Group>
                        </Modal>
                        {children}
                    </ModalsProvider>
                </CodeHighlightAdapterProvider>
            </MantineProvider>
        </QueryClientProvider>
    );
}
