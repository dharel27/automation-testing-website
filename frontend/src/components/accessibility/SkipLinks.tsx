import React from 'react';
import { FocusManager } from '../../utils/accessibility';

interface SkipLink {
  href: string;
  label: string;
  targetId: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  {
    href: '#main-content',
    label: 'Skip to main content',
    targetId: 'main-content',
  },
  {
    href: '#main-navigation',
    label: 'Skip to navigation',
    targetId: 'main-navigation',
  },
  {
    href: '#footer',
    label: 'Skip to footer',
    targetId: 'footer',
  },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultLinks,
}) => {
  const focusManager = FocusManager.getInstance();

  const handleSkipLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    event.preventDefault();
    focusManager.handleSkipLink(targetId);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      focusManager.handleSkipLink(targetId);
    }
  };

  return (
    <div className="skip-links" data-testid="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={(e) => handleSkipLinkClick(e, link.targetId)}
          onKeyDown={(e) => handleKeyDown(e, link.targetId)}
          data-testid={`skip-link-${link.targetId}`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
