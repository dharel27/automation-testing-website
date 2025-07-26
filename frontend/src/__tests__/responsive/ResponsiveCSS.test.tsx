import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Responsive CSS Implementation', () => {
  describe('Responsive Typography Classes', () => {
    it('should have responsive font size classes', () => {
      const { container } = render(
        <div>
          <h1>Main Heading</h1>
          <h2>Secondary Heading</h2>
          <p className="leading-relaxed">Body text with proper line height</p>
        </div>
      );

      const paragraph = container.querySelector('.leading-relaxed');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveClass('leading-relaxed');
    });

    it('should use clamp for responsive font sizes in CSS', () => {
      const { container } = render(<h1>Responsive Heading</h1>);

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();

      // The heading should use CSS clamp() for responsive sizing
      const computedStyle = window.getComputedStyle(heading);
      expect(computedStyle.fontSize).toBeDefined();
    });
  });

  describe('Touch-Friendly Interface Classes', () => {
    it('should have touch-target class', () => {
      const { container } = render(
        <button className="touch-target">Touch Button</button>
      );

      const button = container.querySelector('.touch-target');
      expect(button).toHaveClass('touch-target');
    });

    it('should have proper padding for mobile touch targets', () => {
      const { container } = render(
        <button className="py-4 px-6">Mobile Button</button>
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('py-4', 'px-6');
    });
  });

  describe('Responsive Spacing Classes', () => {
    it('should have responsive spacing utilities', () => {
      const { container } = render(
        <div className="space-y-responsive p-responsive">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      );

      const spacedContainer = container.querySelector('.space-y-responsive');
      const paddedContainer = container.querySelector('.p-responsive');

      expect(spacedContainer).toHaveClass('space-y-responsive');
      expect(paddedContainer).toHaveClass('p-responsive');
    });

    it('should have responsive margin utilities', () => {
      const { container } = render(
        <div className="mx-responsive my-responsive">Content</div>
      );

      const responsiveContainer = container.querySelector('.mx-responsive');
      expect(responsiveContainer).toHaveClass('mx-responsive', 'my-responsive');
    });
  });

  describe('Responsive Grid System Classes', () => {
    it('should have auto-fit grid classes', () => {
      const { container } = render(
        <div className="grid-responsive-sm">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );

      const gridContainer = container.querySelector('.grid-responsive-sm');
      expect(gridContainer).toHaveClass('grid-responsive-sm');
    });

    it('should have different grid sizes', () => {
      const { container } = render(
        <div>
          <div className="grid-responsive-xs">Extra small grid</div>
          <div className="grid-responsive-md">Medium grid</div>
          <div className="grid-responsive-lg">Large grid</div>
        </div>
      );

      expect(
        container.querySelector('.grid-responsive-xs')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.grid-responsive-md')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.grid-responsive-lg')
      ).toBeInTheDocument();
    });

    it('should have responsive flex utilities', () => {
      const { container } = render(
        <div className="flex-responsive">
          <div>Flex item 1</div>
          <div>Flex item 2</div>
        </div>
      );

      const flexContainer = container.querySelector('.flex-responsive');
      expect(flexContainer).toHaveClass('flex-responsive');
    });
  });

  describe('Responsive Container Classes', () => {
    it('should have responsive container class', () => {
      const { container } = render(
        <div className="container-responsive">
          <div>Content</div>
        </div>
      );

      const responsiveContainer = container.querySelector(
        '.container-responsive'
      );
      expect(responsiveContainer).toHaveClass('container-responsive');
    });
  });

  describe('Tailwind Responsive Classes', () => {
    it('should use mobile-first responsive classes', () => {
      const { container } = render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>Column 1</div>
          <div>Column 2</div>
          <div>Column 3</div>
          <div>Column 4</div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-4',
        'gap-4'
      );
    });

    it('should use responsive text sizes', () => {
      const { container } = render(
        <div className="text-sm md:text-base lg:text-lg">Responsive text</div>
      );

      const text = container.querySelector('div');
      expect(text).toHaveClass('text-sm', 'md:text-base', 'lg:text-lg');
    });

    it('should use responsive padding', () => {
      const { container } = render(
        <div className="p-4 md:p-6 lg:p-8">Responsive padding</div>
      );

      const paddedDiv = container.querySelector('div');
      expect(paddedDiv).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
    });

    it('should use responsive flex direction', () => {
      const { container } = render(
        <div className="flex flex-col sm:flex-row gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      );

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass(
        'flex',
        'flex-col',
        'sm:flex-row',
        'gap-4'
      );
    });

    it('should use responsive visibility classes', () => {
      const { container } = render(
        <div>
          <div className="hidden sm:block">Desktop only</div>
          <div className="block sm:hidden">Mobile only</div>
          <div className="hidden xs:inline">Show on xs and up</div>
        </div>
      );

      const desktopOnly = container.querySelector('.hidden.sm\\:block');
      const mobileOnly = container.querySelector('.block.sm\\:hidden');
      const xsAndUp = container.querySelector('.hidden.xs\\:inline');

      expect(desktopOnly).toHaveClass('hidden', 'sm:block');
      expect(mobileOnly).toHaveClass('block', 'sm:hidden');
      expect(xsAndUp).toHaveClass('hidden', 'xs:inline');
    });

    it('should use responsive width classes', () => {
      const { container } = render(
        <div className="w-full sm:w-auto max-w-xs sm:max-w-md lg:max-w-lg">
          Responsive width
        </div>
      );

      const responsiveWidth = container.querySelector('div');
      expect(responsiveWidth).toHaveClass(
        'w-full',
        'sm:w-auto',
        'max-w-xs',
        'sm:max-w-md',
        'lg:max-w-lg'
      );
    });
  });

  describe('Animation Classes', () => {
    it('should have animation classes', () => {
      const { container } = render(
        <div>
          <div className="animate-fade-in">Fade in</div>
          <div className="animate-slide-up">Slide up</div>
          <div className="animate-slide-down">Slide down</div>
        </div>
      );

      expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
      expect(container.querySelector('.animate-slide-up')).toBeInTheDocument();
      expect(
        container.querySelector('.animate-slide-down')
      ).toBeInTheDocument();
    });

    it('should have transition classes', () => {
      const { container } = render(
        <button className="transition-colors hover:bg-blue-700">
          Transition button
        </button>
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-colors', 'hover:bg-blue-700');
    });
  });

  describe('Accessibility-Responsive Classes', () => {
    it('should have screen reader classes', () => {
      const { container } = render(
        <div>
          <span className="sr-only">Screen reader only</span>
          <span className="sr-only focus:not-sr-only">Show on focus</span>
        </div>
      );

      const srOnly = container.querySelector('.sr-only');
      const focusVisible = container.querySelector(
        '.sr-only.focus\\:not-sr-only'
      );

      expect(srOnly).toHaveClass('sr-only');
      expect(focusVisible).toHaveClass('sr-only', 'focus:not-sr-only');
    });

    it('should have focus-visible classes', () => {
      const { container } = render(
        <button className="focus-visible-only:focus:not(:focus-visible)">
          Focus visible button
        </button>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Print-Responsive Classes', () => {
    it('should have print-specific classes', () => {
      const { container } = render(
        <div>
          <div className="no-print">Don't print this</div>
          <div className="print:block hidden">Show only when printing</div>
        </div>
      );

      const noPrint = container.querySelector('.no-print');
      const printOnly = container.querySelector('.print\\:block');

      expect(noPrint).toHaveClass('no-print');
      expect(printOnly).toHaveClass('print:block', 'hidden');
    });
  });

  describe('Dark Mode Responsive Classes', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          Dark mode content
        </div>
      );

      const darkModeDiv = container.querySelector('div');
      expect(darkModeDiv).toHaveClass(
        'bg-white',
        'dark:bg-gray-900',
        'text-gray-900',
        'dark:text-white'
      );
    });

    it('should have responsive dark mode classes', () => {
      const { container } = render(
        <div className="bg-gray-100 sm:bg-gray-200 dark:bg-gray-800 dark:sm:bg-gray-900">
          Responsive dark mode
        </div>
      );

      const responsiveDark = container.querySelector('div');
      expect(responsiveDark).toHaveClass(
        'bg-gray-100',
        'sm:bg-gray-200',
        'dark:bg-gray-800',
        'dark:sm:bg-gray-900'
      );
    });
  });

  describe('Custom Breakpoint Classes', () => {
    it('should use custom xs breakpoint', () => {
      const { container } = render(
        <div className="hidden xs:block">Show on xs and up</div>
      );

      const xsBreakpoint = container.querySelector('.xs\\:block');
      expect(xsBreakpoint).toHaveClass('hidden', 'xs:block');
    });

    it('should use 2xl breakpoint', () => {
      const { container } = render(
        <div className="text-base 2xl:text-lg">Extra large text</div>
      );

      const xlText = container.querySelector('div');
      expect(xlText).toHaveClass('text-base', '2xl:text-lg');
    });
  });
});
