import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'unahur.student-preview';

export interface StudentPreviewSelection {
  materiaId: number;
  cursadaId: number;
  comisionId: number;
  comisionNombre: string;
}

interface StudentPreviewContextValue {
  selection: StudentPreviewSelection | null;
  isPreviewing: boolean;
  startPreview: (selection: StudentPreviewSelection) => void;
  stopPreview: () => void;
}

const StudentPreviewContext = createContext<StudentPreviewContextValue>({
  selection: null,
  isPreviewing: false,
  startPreview: () => undefined,
  stopPreview: () => undefined,
});

function readStoredSelection(): StudentPreviewSelection | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StudentPreviewSelection;
    if (
      !Number.isInteger(value.materiaId) ||
      !Number.isInteger(value.cursadaId) ||
      !Number.isInteger(value.comisionId) ||
      typeof value.comisionNombre !== 'string'
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function StudentPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [selection, setSelection] = useState<StudentPreviewSelection | null>(
    readStoredSelection
  );

  const stopPreview = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSelection(null);
  }, []);

  const startPreview = useCallback((next: StudentPreviewSelection) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSelection(next);
  }, []);

  useEffect(() => {
    if (!selection) return;
    const match = location.pathname.match(/^\/materia\/(\d+)/);
    if (!match || Number(match[1]) !== selection.materiaId) stopPreview();
  }, [location.pathname, selection, stopPreview]);

  const value = useMemo(
    () => ({
      selection,
      isPreviewing: selection !== null,
      startPreview,
      stopPreview,
    }),
    [selection, startPreview, stopPreview]
  );

  return (
    <StudentPreviewContext.Provider value={value}>
      {children}
    </StudentPreviewContext.Provider>
  );
}

export const useStudentPreview = () => useContext(StudentPreviewContext);
