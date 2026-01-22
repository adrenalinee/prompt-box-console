import { IconDotsVertical } from "@tabler/icons-react"
import { ActionIcon } from "@mantine/core"
import { MouseEventHandler } from "react"


/**
 * @param onClick
 * @constructor
 */
export default function DefaultMoreButton({
  onClick
}: {
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined
}) {
  return (
    <ActionIcon
      color="gray"
      variant="subtle"
      size="input-sm"
      onClick={onClick}
    >
      <IconDotsVertical size="1.2rem" />
    </ActionIcon>
  )
}