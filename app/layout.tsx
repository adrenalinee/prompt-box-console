import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.layer.css";
// import "@mantine/modals/styles.layer.css";
import "@mantine/dates/styles.layer.css";
// import "@mantine/code-highlight/styles.layer.css";
import '@mantine/code-highlight/styles.css';
import "./globals.css";

import type { Metadata } from "next";
import React from "react";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
    title: "PromptBox",
    description: "PromptBox",
};

export default function RootLayout({
   children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const serverPhase = process.env.SERVER_PHASE ?? "local";
    return (
        <html lang="ko" {...mantineHtmlProps}>
        <head>
            <ColorSchemeScript />
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.__SERVER_PHASE__=${JSON.stringify(serverPhase)};`,
                }}
            />
        </head>
        <body className="antialiased">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
