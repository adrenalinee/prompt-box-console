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
    return (
        <html lang="ko" {...mantineHtmlProps}>
        <head>
            <ColorSchemeScript />
        </head>
        <body className="antialiased">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
