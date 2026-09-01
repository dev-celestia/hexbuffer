import * as React from "react";
import * as ReactDOM from "react-dom";

export interface WindowContextType {
  isInWindow: boolean;
  isStandalone: boolean;
  windowElement: HTMLElement | null;
  id?: string;
  headerSlotNode: HTMLDivElement | null;
  setHeaderSlotNode: (node: HTMLDivElement | null) => void;
  hasHeaderSlotContent: boolean;
  setHasHeaderSlotContent: (hasContent: boolean) => void;
}

export const WindowContext = React.createContext<WindowContextType>({
  isInWindow: false,
  isStandalone: false,
  windowElement: null,
  headerSlotNode: null,
  setHeaderSlotNode: () => {},
  hasHeaderSlotContent: false,
  setHasHeaderSlotContent: () => {},
});

export function useWindowContext(): WindowContextType {
  return React.useContext(WindowContext);
}

export interface WindowProviderProps {
  windowElement: HTMLElement | null;
  id?: string;
  isStandalone?: boolean;
  children: React.ReactNode;
}

export function WindowProvider({
  windowElement,
  id,
  isStandalone = false,
  children,
}: WindowProviderProps) {
  const [headerSlotNode, setHeaderSlotNode] = React.useState<HTMLDivElement | null>(null);
  const [hasHeaderSlotContent, setHasHeaderSlotContent] = React.useState(false);

  const value = React.useMemo<WindowContextType>(
    () => ({
      isInWindow: !!windowElement,
      isStandalone,
      windowElement,
      id,
      headerSlotNode,
      setHeaderSlotNode,
      hasHeaderSlotContent,
      setHasHeaderSlotContent,
    }),
    [windowElement, isStandalone, id, headerSlotNode, hasHeaderSlotContent]
  );

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

export interface WindowHeaderSlotProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Declaratively injects custom buttons, badges, or controls into the window header
 * directly beside the split-screen (Tile Left / Tile Right) controls or window controls.
 */
export function WindowHeaderSlot({ children, className }: WindowHeaderSlotProps) {
  const { headerSlotNode, setHasHeaderSlotContent } = useWindowContext();

  React.useEffect(() => {
    const hasChildren = Boolean(children);
    setHasHeaderSlotContent(hasChildren);
    return () => {
      setHasHeaderSlotContent(false);
    };
  }, [children, setHasHeaderSlotContent]);

  if (!headerSlotNode || !children) {
    return null;
  }

  return ReactDOM.createPortal(
    className ? <div className={className}>{children}</div> : children,
    headerSlotNode
  );
}

export const WindowHeaderActions = WindowHeaderSlot;

export {
  useStandalone,
  useIsStandalone,
  StandaloneOnly,
  DesktopOnly,
  type StandaloneState,
  type StandaloneOnlyProps,
  type DesktopOnlyProps,
} from "@/hooks/use-standalone";
