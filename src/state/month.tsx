import { createContext, useContext, useState, type ReactNode } from "react";

import { currentMonth } from "@/src/domain/month";

const MonthContext = createContext<{
  month: string;
  setMonth: (month: string) => void;
} | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(currentMonth());
  return <MonthContext.Provider value={{ month, setMonth }}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const value = useContext(MonthContext);
  if (!value) throw new Error("useMonth fora do provider");
  return value;
}
