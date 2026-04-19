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

  const isMobile = windowWidth < 768;

  // Mobile: single column, board fills width
  // Desktop: two columns side by side, each board gets half the viewport minus padding/gap
  const boardWidth = isMobile
    ? Math.min(windowWidth - 32, 420)
    : Math.min(Math.floor((windowWidth - 80) / 2), 420);

  const mainBoardWidth = boardWidth;
  // Mobile: partner board is proportionally smaller; desktop: same size as main board
  const partnerBoardWidth = isMobile ? Math.round(boardWidth * (280 / 420)) : boardWidth;

  return { mainBoardWidth, partnerBoardWidth, isMobile };
}
