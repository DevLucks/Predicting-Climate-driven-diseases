import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const PAGES = ['/', '/model-results', '/risk-heatmap', '/live-predictor', '/methodology'];

interface PresentationCtx {
  isPresentation: boolean;
  toggle: () => void;
}

const Ctx = createContext<PresentationCtx>({ isPresentation: false, toggle: () => {} });

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [isPresentation, setIsPresentation] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const navigate = useNavigate();

  const toggle = useCallback(() => setIsPresentation(p => !p), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-presentation', String(isPresentation));
  }, [isPresentation]);

  useEffect(() => {
    if (!isPresentation) return;
    const id = setInterval(() => {
      setPageIdx(i => {
        const next = (i + 1) % PAGES.length;
        navigate(PAGES[next]);
        return next;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [isPresentation, navigate]);

  return <Ctx.Provider value={{ isPresentation, toggle }}>{children}</Ctx.Provider>;
}

export const usePresentation = () => useContext(Ctx);
