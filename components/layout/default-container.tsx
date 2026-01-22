import { Container } from "@mantine/core";
import { ReactNode } from "react";

/**
 *
 * @param children
 * @constructor
 */
export default function DefaultContainer({
  pt,
  children
}: Readonly<{
  pt?: string
  children: ReactNode;
}>) {
  return (
    <Container className="w-full" p="xs" pt={pt}>
      {children}
    </Container>
  )
}