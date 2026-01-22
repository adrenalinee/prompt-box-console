"use client"

import { Alert, Button, Divider, Select, Stack, Table, Text } from "@mantine/core"
import { useContext } from "react"
import { modals } from "@mantine/modals"
import { appConfig } from "@/config/app-config"
import { useRouter } from "next/navigation"
import { ServerPhaseContext } from "@/components/layout/server-phase-context-provider";


export default function ServerInformationButton({
  size
}: {
  size?: string
}) {
  const serverPhase = useContext(ServerPhaseContext)

  return (
    <Button
      variant="default"
      // size="compact-md"
      size={size}
      onClick={() => {
        modals.open({
          title: <Text>Server information</Text>,
          size: 'lg',
          children: (
            <ServerInformation serverPhase={serverPhase} />
          )
        })
      }}
    >{serverPhase}</Button>
  )
}

function ServerInformation({
  serverPhase
}: {
  serverPhase: string
}) {
  // const initServerPhase = getInitServerPhase()
  // const router = useRouter()
  const apiBaseUrl = appConfig.apiBaseUrl[serverPhase]

  return (
    <Stack>
      <Alert>
        호출할 api server 의 phase 를 선택합니다.
        기본적으로 furiosa 가 실행되는 서버와 같은 phase 가 선택되어 있습니다만, 아래에서 변경할 수 있습니다.
      </Alert>
      <ServerInformationSelect />
      <Divider />
      <b>Current information</b>
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td c="gray">Server Phase</Table.Td>
            <Table.Td>{serverPhase}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="gray">centerflow server api address</Table.Td>
            <Table.Td>{apiBaseUrl}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

export function ServerInformationSelect({

}) {
  // const initServerPhase = getInitServerPhase()
  const router = useRouter()
  const serverPhase = useContext(ServerPhaseContext)

  return (
    <Select
      label="server phase"
      defaultValue={serverPhase}
      comboboxProps={{ shadow: 'md',  }}
      onChange={(_value) => {
        // if (_value === initServerPhase) {
        //   router.push('/')
        // } else {
        //   router.push('/' + _value)
        // }

        router.push('/' + _value)
        modals.closeAll()
      }}
      data={[
        { group: 'local network', items: ['local'] },
        { group: 'dev network', items: ['dev', 'sandbox'] },
        { group: 'prod network', items: ['cbt', 'stage', 'prod'] },
      ]}
    />
  )
}