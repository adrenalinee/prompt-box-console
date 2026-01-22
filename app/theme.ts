"use client"

/** Custom theme */
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  DEFAULT_THEME,
  Group,
  Input,
  type MantineBreakpointsValues,
  type MantineThemeColors,
  MantineThemeOverride,
  Modal,
  Paper,
  Stack,
  Table, Tooltip
} from "@mantine/core"
import localFont from 'next/font/local'

export const colors: MantineThemeColors = DEFAULT_THEME.colors;
export const breakpoints: MantineBreakpointsValues = DEFAULT_THEME.breakpoints;

const myFont = localFont({
  src: [
    {
      path: '../public/fonts/notoSansKorea.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/notoSansKorea.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--my-font'
})

const myFontMonospace = localFont({
  src: [
    {
      path: '../public/fonts/Orbit-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
})

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

// export const theme = mergeMantineTheme(
//   DEFAULT_THEME,
//   createTheme({
//     // fontFamily: geistSans.style.fontFamily,
//     // fontFamilyMonospace: geistMono.style.fontFamily,
//     breakpoints,
//     colors,
//     scale: 1.1,
//     defaultRadius: "md",
//     primaryColor: 'indigo',
//     autoContrast: true
//   }),
// );

// export const theme = createTheme({
//   // fontFamily: geistSans.style.fontFamily,
//   // fontFamilyMonospace: geistMono.style.fontFamily,
//   breakpoints,
//   colors,
//   scale: 1.1,
//   defaultRadius: "md",
//   primaryColor: 'indigo',
//   autoContrast: true
// })

export const themeOverride = {
  breakpoints,
  colors,
  scale: 1.1,
  defaultRadius: "md",
  primaryColor: 'blue',
  // primaryColor: 'dark',
  autoContrast: true,
  fontFamily: myFont.style.fontFamily,
  fontFamilyMonospace: myFontMonospace.style.fontFamily,
  components: {
    Input: Input.extend({
      defaultProps: {
        // variant: 'filled'
      }
    }),
    InputWrapper: Input.Wrapper.extend({
      defaultProps: {
        size: "md",
      },
    }),
    Stack: Stack.extend({
      defaultProps: {
        gap: 'xs'
      }
    }),
    Group: Group.extend({
      defaultProps: {
        gap: 'xs'
      }
    }),
    Alert: Alert.extend({
      defaultProps: {
        color: 'yellow',
        variant: 'light',
        p: 'xs'
      }
    }),
    Button: Button.extend({
      defaultProps: {
        // color: 'violet',
        // c: 'yellow',
        variant: 'default',
        // variant: 'light',
        // variant: 'subtle',
        size: 'sm',
        gradient: { from: 'grape', to: 'violet', deg: 135 }
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        size: 'input-sm',
        variant: 'subtle',
        c: 'dark',
        gradient: { from: 'grape', to: 'violet', deg: 135 }
      }
    }),
    Badge: Badge.extend({
      defaultProps: {
        // color: 'dark',
        variant: 'light',
      }
    }),
    Paper: Paper.extend({
      defaultProps: {
        className: 'overflow-hidden'
      }
    }),
    Modal: Modal.extend({
      defaultProps: {
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        }
      }
    }),
    Table: Table.extend({
      defaultProps: {

      }

    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true,
      }
    }),
  },
} as MantineThemeOverride