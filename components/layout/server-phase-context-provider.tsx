'use client'

import { createContext, ReactNode } from "react";

export const ServerPhaseContext = createContext<string>('local')

export default function ServerPhaseContextProvider({
  initServerPhase,
  children,
}: {
  initServerPhase: string
  children: ReactNode
}) {
  return (
    <ServerPhaseContext.Provider value={initServerPhase}>
      {children}
    </ServerPhaseContext.Provider>
  )
}