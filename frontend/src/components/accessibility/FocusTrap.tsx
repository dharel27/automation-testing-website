import React, { useEffect, useRef, ReactNode } from 'react';
import {
  getFocusableElements,
  trapFocus,
  FocusManager,
} from '../../utils/accessibility';

interface FocusTrapProps {
  children: ReactNode;
  isActive: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  restoreFocus = true,
  autoFocus = true,
  className = '',
  'data-testid': testId = 'focus-trap',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusManager = FocusManager.getInstance();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus if restore is enabled
    if (restoreFocus) {
      focusManager.saveFocus();
    }

    // Auto-focus first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (containerRef.current) {
        trapFocus(containerRef.current, event);
      }
    };

    // Add event listener for focus trapping
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus when component unmounts or becomes inactive
      if (restoreFocus) {
        focusManager.restoreFocus();
      }
    };
  }, [isActive, autoFocus, restoreFocus, focusManager]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid={testId}
      role="region"
      aria-label="Focus trapped area"
    >
      {children}
    </div>
  );
};

export default FocusTrap;
