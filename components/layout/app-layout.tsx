"use client"

import { ReactNode } from "react"
import { AppShell, Group } from "@mantine/core"
import AppSideBar from "@/components/layout/app-side-bar"
import SideMenuDrawerButton from "@/components/layout/side-menu-drawer-button"
import Logo from "@/components/layout/logo"
import { appConfig } from "@/config/app-config"
import { useDisclosure } from "@mantine/hooks"

/**
 *
 * @param children
 * @constructor
 */
export default function AppLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  // const [disabled, { toggle: toggleDisabled }] = useDisclosure()
  const [disabled, disabledHandler] = useDisclosure()

  return (
    <AppShell
      layout="alt"
      header={{ height: { base: appConfig.headHeight, md: 0 } }}
      navbar={{
        width: appConfig.sidebarWidth,
        breakpoint: 'md',
        collapsed: { mobile: true },
      }}
      padding=""
      disabled={disabled}
      className="flex flex-row"
    >
      <AppShell.Header hiddenFrom="md" className="flex align-center" style={{
        height: appConfig.headHeight
      }}>
        <Group
          className="bg-[var(--mantine-color-gray-light)] grow shadow-inner"
          justify="space-between" align="center" gap="xs" px="md" style={ {
        } }>
          <Group>
            <Logo/>
            <SideMenuDrawerButton appShellDisable={disabledHandler.open} />
          </Group>
          {/*<SideBarCommandGroup appShellDisable={disabledHandler.open} />*/}
        </Group>
      </AppShell.Header>
      <AppShell.Navbar className="flex-col grow" >
        <AppShell.Section grow className="bg-[var(--mantine-color-gray-light)] shadow-inner">
          <AppSideBar appShellDisable={disabledHandler.open} />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main className="grow">{children}</AppShell.Main>
    </AppShell>
  )
}
