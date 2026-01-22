import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

/**
 * 표준 알람 팝업을 띄움
 * @param title
 * @param message
 */
export function showNotification({
  title,
  message
}: {
  title: string
  message: string
}) {
  notifications.show({
    title: title,
    message: message,
    position: 'bottom-center',
    withBorder: true,
    variant: 'filled'
  })
}

export function openAlertModal(
  title: string,
  message: string
) {
  modals.openContextModal({
    modal: 'alert',
    title: title,
    innerProps: {
      modalBody: message,
    }
  })
}