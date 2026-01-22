"use client"

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core"
import { IconMoon, IconSun } from "@tabler/icons-react"

/**
 *
 * @constructor
 */
export default function ColorSchemeSmallButton() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="input-xs"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ?
        <IconMoon style={{ width: '80%', height: '80%' }} /> :
        <IconSun style={{ width: '80%', height: '80%' }} />
      }
    </ActionIcon>
  )
}

export function ColorSchemeButton() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      color="gray"
      variant="subtle"
      size="input-sm"
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ?
        <IconMoon /> :
        <IconSun />
      }
    </ActionIcon>
  )
}