import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  selectedChatId: number | null;
  setSelectedChatId: (id: number | null) => void;
};

const PanelChatUiContext = createContext<Ctx | null>(null);

export function PanelChatUiProvider({ children }: { children: ReactNode }) {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const v = useMemo(() => ({ selectedChatId, setSelectedChatId }), [selectedChatId]);
  return <PanelChatUiContext.Provider value={v}>{children}</PanelChatUiContext.Provider>;
}

/** /panel içinde seçili sohbet; sol çekmece listesinde vurgu için shell ile paylaşılır */
export function useSyncPanelChatSelection(selectedChatId: number | null) {
  const ctx = useContext(PanelChatUiContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setSelectedChatId(selectedChatId);
  }, [ctx, selectedChatId]);
}

export function usePanelChatSelectedId(): number | null {
  const ctx = useContext(PanelChatUiContext);
  return ctx?.selectedChatId ?? null;
}
