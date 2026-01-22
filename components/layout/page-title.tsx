import { Group } from "@mantine/core";
import { ReactNode } from "react";


export default function PageTitle({
  title,
  commands
}: {
  title: ReactNode
  commands?: ReactNode
}) {
  return (
    <Group justify="space-between">
      {title}
      <Group>
        {commands}
      </Group>
    </Group>
  )
}