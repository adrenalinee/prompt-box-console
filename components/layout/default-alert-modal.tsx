'use client'

import { ContextModalProps } from "@mantine/modals";
import { Button, Text } from "@mantine/core";
import { ReactNode } from "react";


export default function DefaultAlertModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  modalBody: ReactNode
}>) {
  return (
    <>
      <Text size="sm">{innerProps.modalBody}</Text>
      <Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
        Close
      </Button>
    </>
  )
}