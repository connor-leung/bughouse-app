'use client';

import { useState, useEffect } from 'react';

export function useBoardWidth() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    // Sync on mount in case SSR default differs
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainBoardWidth = Math.min(windowWidth - 32, 420);
  const partnerBoardWidth = Math.round(mainBoardWidth * (280 / 420));
  const isMobile = windowWidth < 768;

  return { mainBoardWidth, partnerBoardWidth, isMobile };
}
