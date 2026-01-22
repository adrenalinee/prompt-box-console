"use client"

import { IconArrowBarLeft, IconMenu2 } from "@tabler/icons-react"
import { ActionIcon, Drawer } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import AppSideBar from "@/components/layout/app-side-bar"

/**
 *
 * @constructor
 */
export default function SideMenuDrawerButton({
  appShellDisable
}: {
  appShellDisable: () => void
}) {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <ActionIcon
        size="lg"
        variant="default"
        onClick={open}
      ><IconMenu2 /></ActionIcon>
      <Drawer.Root
        opened={opened}
        onClose={close}
        size="xs"
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Body p="0">
            <AppSideBar appShellDisable={appShellDisable} rightSection={<CloseButton close={close} />} />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  )
}

/**
 *
 * @param close
 * @constructor
 */
function CloseButton({
  close
}: {
  close: () => void
}) {
  return (
    <ActionIcon
      size="lg"
      variant="default"
      onClick={close}
    ><IconArrowBarLeft /></ActionIcon>
  )
}