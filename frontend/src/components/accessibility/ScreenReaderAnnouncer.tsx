import React, { useEffect, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  'data-testid'?: string;
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  priority = 'polite',
  clearAfter = 5000,
  'data-testid': testId = 'screen-reader-announcer',
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!currentMessage) return null;

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      data-testid={testId}
    >
      {currentMessage}
    </div>
  );
};

// Hook for managing screen reader announcements
export function useScreenReaderAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    priority: 'polite' | 'assertive';
  } | null>(null);

  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({ message, priority });
  };

  const clear = () => {
    setAnnouncement(null);
  };

  return {
    announcement,
    announce,
    clear,
    ScreenReaderAnnouncer: announcement ? (
      <ScreenReaderAnnouncer
        message={announcement.message}
        priority={announcement.priority}
      />
    ) : null,
  };
}

export default ScreenReaderAnnouncer;
