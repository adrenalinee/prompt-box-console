import React, { ReactNode } from "react";
import { Divider, Skeleton, Stack } from "@mantine/core";
import { appConfig } from "@/config/app-config"

export default function PageLayout({
  // breadcrumbs,
  title,
  children
}: {
  breadcrumbs?: ReactNode
  title?: ReactNode
  children: ReactNode
}) {

  return (
    <>
      {/*<Stack p="xs" gap="xs" justify="center" className="bg-[var(--mantine-color-gray-light)]" style={{height: appConfig.headHeight}}>*/}
      <Stack p="xs" gap="xs" justify="center" style={{
        height: appConfig.headHeight,
      }}>
        {title !== undefined ? title : <Skeleton height={36} />}
      </Stack>
      <Divider />
      {children}
    </>
  )
}