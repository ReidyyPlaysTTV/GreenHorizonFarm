
"use client";

import { useState, useEffect, useRef } from 'react';

const useIdleTimeout = ({ onIdle, idleTime = 1 } : { onIdle: () => void, idleTime: number }) => {
  const idleTimeout = idleTime * 60 * 1000;
  const timeoutId = useRef<number | null>(null);

  const startTimer = () => {
    timeoutId.current = window.setTimeout(onIdle, idleTimeout);
  };

  const resetTimer = () => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    startTimer();
  };

  const handleEvent = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    // Set initial timer
    startTimer();
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [onIdle, idleTimeout]); // Re-run effect if onIdle or idleTime changes
};

export { useIdleTimeout };
