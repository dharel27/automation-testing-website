import React, { useState, useRef, useEffect } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenItems?: string[];
  'data-testid'?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
  'data-testid': testId = 'accordion',
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(defaultOpenItems)
  );
  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);

    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(itemId);
    }

    setOpenItems(newOpenItems);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    itemId: string,
    index: number
  ) => {
    const { key } = event;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (index + 1) % items.length;
        const nextItem = items[nextIndex];
        if (nextItem && !nextItem.disabled) {
          itemRefs.current[nextItem.id]?.focus();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = index === 0 ? items.length - 1 : index - 1;
        const prevItem = items[prevIndex];
        if (prevItem && !prevItem.disabled) {
          itemRefs.current[prevItem.id]?.focus();
        }
        break;

      case 'Home':
        event.preventDefault();
        const firstEnabledItem = items.find((item) => !item.disabled);
        if (firstEnabledItem) {
          itemRefs.current[firstEnabledItem.id]?.focus();
        }
        break;

      case 'End':
        event.preventDefault();
        const lastEnabledItem = [...items]
          .reverse()
          .find((item) => !item.disabled);
        if (lastEnabledItem) {
          itemRefs.current[lastEnabledItem.id]?.focus();
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!items[index].disabled) {
          toggleItem(itemId);
        }
        break;
    }
  };

  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg"
      data-testid={testId}
    >
      {items.map((item, index) => {
        const isOpen = openItems.has(item.id);
        const isDisabled = item.disabled;

        return (
          <div
            key={item.id}
            className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          >
            <button
              ref={(el) => (itemRefs.current[item.id] = el)}
              className={`w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                isDisabled
                  ? 'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'
              }`}
              onClick={() => !isDisabled && toggleItem(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id, index)}
              aria-expanded={isOpen}
              aria-controls={`${testId}-content-${item.id}`}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              data-testid={`${testId}-trigger-${item.id}`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {item.title}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              id={`${testId}-content-${item.id}`}
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
              aria-hidden={!isOpen}
              data-testid={`${testId}-content-${item.id}`}
            >
              <div className="px-6 py-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
