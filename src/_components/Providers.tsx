// src/_components/Providers.tsx
"use client";

import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </SessionProvider>
  );
}