import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type PanelChatBridgeHandlers = {
  selectChat: (id: number) => void;
  newDraft: () => void;
  onDeletedChat?: (id: number) => void;
};

type Ctx = {
  register: (h: PanelChatBridgeHandlers | null) => void;
  getHandlers: () => PanelChatBridgeHandlers | null;
};

const PanelChatBridgeContext = createContext<Ctx | null>(null);

export function PanelChatBridgeProvider({ children }: { children: ReactNode }) {
  const ref = useRef<PanelChatBridgeHandlers | null>(null);
  const register = useCallback((h: PanelChatBridgeHandlers | null) => {
    ref.current = h;
  }, []);
  const getHandlers = useCallback(() => ref.current, []);
  const v = useMemo(() => ({ register, getHandlers }), [register, getHandlers]);
  return <PanelChatBridgeContext.Provider value={v}>{children}</PanelChatBridgeContext.Provider>;
}

export function usePanelChatBridgeRegister(): (h: PanelChatBridgeHandlers | null) => void {
  const c = useContext(PanelChatBridgeContext);
  if (!c) throw new Error("PanelChatBridgeProvider gerekli");
  return c.register;
}

export function usePanelChatBridgeGet(): () => PanelChatBridgeHandlers | null {
  const c = useContext(PanelChatBridgeContext);
  if (!c) throw new Error("PanelChatBridgeProvider gerekli");
  return c.getHandlers;
}
