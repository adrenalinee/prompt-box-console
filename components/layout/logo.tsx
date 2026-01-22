import { Group, Title } from "@mantine/core"
import Link from "next/link"
import { ReactNode } from "react"


export default function Logo({
  rightSection
}: {
  rightSection?: ReactNode
}) {
  return (
    <Group gap="2" align="center">
      <Link href="/" >
        <Group align="center">
          <Title order={3}>LTMP</Title>
          {/*<Title order={4}>Bot</Title>*/}
        </Group>
      </Link>
      {rightSection !== undefined ? rightSection : undefined}
      {/*<SideMenuDrawerButton />*/}
    </Group>
  )
}
