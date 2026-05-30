import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient, Workspace } from "../lib/api-client";
import { useAuth } from "./auth-context";

const STORAGE_KEY = "currentWorkspaceId";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  const applyCurrentId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setCurrentWorkspaceId(id);
  }, []);

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.getWorkspaces();
      setWorkspaces(list);

      // Keep the persisted selection if it's still valid, else fall back to
      // the first workspace the user belongs to.
      const saved = localStorage.getItem(STORAGE_KEY);
      const stillValid = list.some((w) => w.id === saved);
      applyCurrentId(stillValid ? saved : (list[0]?.id ?? null));
    } finally {
      setIsLoading(false);
    }
  }, [applyCurrentId]);

  // Load (or clear) workspaces as auth state changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      applyCurrentId(null);
      setIsLoading(false);
      return;
    }
    void loadWorkspaces();
  }, [isAuthenticated, loadWorkspaces, applyCurrentId]);

  const switchWorkspace = useCallback(
    (id: string) => {
      if (id === currentWorkspaceId) return;
      applyCurrentId(id);
      // Scoped data depends on the active workspace — drop cached results so
      // every view refetches for the newly selected tenant.
      queryClient.invalidateQueries();
    },
    [currentWorkspaceId, applyCurrentId, queryClient]
  );

  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        isLoading,
        switchWorkspace,
        refreshWorkspaces: loadWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
