import { ActionIcon, Group } from "@mantine/core"
import ColorSchemeSmallButton from "@/components/layout/color-scheme-small-button"
import { IconLayoutSidebarLeftCollapse, IconMaximize } from "@tabler/icons-react"


export default function SideBarCommandGroup({
  appShellDisable
}: {
  appShellDisable: () => void
}) {

  return (
    <Group justify="end" p="xs">
      {/*<ServerInformationButton size="compact-md" />*/}
      <AppShellToggleSmallButton appShellDisable={appShellDisable} />
      <ColorSchemeSmallButton />
    </Group>
  )
}

export function AppShellToggleSmallButton({
  appShellDisable
}: {
  appShellDisable: () => void
}) {
  return (
    <ActionIcon
      // variant="default"
      size="input-xs"
      onClick={() => {
        console.log(appShellDisable)
        appShellDisable()
      }}
    ><IconLayoutSidebarLeftCollapse style={{ width: '80%', height: '80%' }} /></ActionIcon>
  )
}

export function AppShellToggleButton({
  appShellDisable
}: {
  appShellDisable: () => void
}) {
  return (
    <ActionIcon
      color="gray"
      variant="subtle"
      size="input-xs"
      onClick={() => appShellDisable()}
    ><IconMaximize style={{ width: '80%', height: '80%' }} /></ActionIcon>
  )
}