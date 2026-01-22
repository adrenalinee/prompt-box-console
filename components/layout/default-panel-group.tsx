import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ReactNode } from "react";

export default function DefaultPanelGroup({
  leftPanel,
  rightPanel,
}: {
  leftPanel: ReactNode
  rightPanel: ReactNode
}) {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={25} minSize={20} maxSize={60}>
        {leftPanel}
      </Panel>
      <PanelResizeHandle className="w-1 bg-[var(--mantine-color-gray-light)] hover:bg-[var(--mantine-primary-color-light-color)]" />
      <Panel defaultSize={75}>
        {rightPanel}
      </Panel>
    </PanelGroup>
  )
}