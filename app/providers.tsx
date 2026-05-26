"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext } from "react";

export type SessionPayload = { userId: string; role: string };

const SessionContext = createContext<SessionPayload>({ userId: "", role: "viewer" });

export function useSession(): SessionPayload {
  return useContext(SessionContext);
}

export function Providers({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={session}>
        {children}
      </SessionContext.Provider>
    </QueryClientProvider>
  );
}
