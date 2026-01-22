import { Divider, Group, NavLink } from "@mantine/core"
import { appConfig } from "@/config/app-config"
import { usePathname } from "next/navigation"
import Logo from "@/components/layout/logo"
import { ReactNode, useContext } from "react"
import SideBarCommandGroup from "@/components/layout/side-bar-command-group"
import { ServerPhaseContext } from "@/components/layout/server-phase-context-provider";

/**
 *
 * @param rightSection
 * @param appShellDisable
 * @constructor
 */
export default function AppSideBar({
  rightSection,
  appShellDisable
}: {
  rightSection?: ReactNode
  appShellDisable: () => void
}) {
  const serverPhase = useContext(ServerPhaseContext)
  // const initServerPhase = getInitServerPhase()
  const pathname = usePathname()

  const navLinks = appConfig.sideNav.map((menu) => {
    // console.log(menu.link)
    return (
      <NavLink
        key={menu.link}
        label={menu.label}
        href={'/' + serverPhase + menu.link}
        leftSection={menu.icon}
        active={pathname.startsWith('/' + serverPhase + menu.link)}
      />
    )
  })

  return (
    <>
      <Group
        // className="bg-[var(--mantine-color-gray-light)] grow"
        justify="start" align="center" gap="xs" px="md" style={{
        height: appConfig.headHeight,
      }}>
        <Logo rightSection={rightSection} />
      </Group>
      <Divider />
      <SideBarCommandGroup appShellDisable={appShellDisable}  />
      <Divider />
      {navLinks}
    </>
  )
}
