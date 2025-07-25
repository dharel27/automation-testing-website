import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from '../Accordion';

describe('Accordion', () => {
  const defaultItems = [
    {
      id: 'item1',
      title: 'First Item',
      content: <div>First content</div>,
    },
    {
      id: 'item2',
      title: 'Second Item',
      content: <div>Second content</div>,
    },
    {
      id: 'item3',
      title: 'Third Item',
      content: <div>Third content</div>,
      disabled: true,
    },
  ];

  const defaultProps = {
    items: defaultItems,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all accordion items', () => {
    render(<Accordion {...defaultProps} />);

    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.getByText('Third Item')).toBeInTheDocument();
  });

  it('opens item when clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    await user.click(firstTrigger);

    expect(screen.getByText('First content')).toBeInTheDocument();
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes item when clicked again', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');

    // Open
    await user.click(firstTrigger);
    expect(screen.getByText('First content')).toBeInTheDocument();

    // Close
    await user.click(firstTrigger);
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes other items when allowMultiple is false', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} allowMultiple={false} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const secondTrigger = screen.getByTestId('accordion-trigger-item2');

    // Open first item
    await user.click(firstTrigger);
    expect(screen.getByText('First content')).toBeInTheDocument();

    // Open second item - should close first
    await user.click(secondTrigger);
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(screen.getByText('Second content')).toBeInTheDocument();
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps multiple items open when allowMultiple is true', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} allowMultiple={true} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const secondTrigger = screen.getByTestId('accordion-trigger-item2');

    // Open first item
    await user.click(firstTrigger);
    expect(screen.getByText('First content')).toBeInTheDocument();

    // Open second item - first should remain open
    await user.click(secondTrigger);
    expect(screen.getByText('First content')).toBeInTheDocument();
    expect(screen.getByText('Second content')).toBeInTheDocument();
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens default items on mount', () => {
    render(
      <Accordion {...defaultProps} defaultOpenItems={['item1', 'item2']} />
    );

    expect(screen.getByText('First content')).toBeInTheDocument();
    expect(screen.getByText('Second content')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-trigger-item1')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByTestId('accordion-trigger-item2')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('handles disabled items correctly', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const disabledTrigger = screen.getByTestId('accordion-trigger-item3');

    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute('aria-disabled', 'true');

    await user.click(disabledTrigger);
    expect(screen.queryByText('Third content')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const secondTrigger = screen.getByTestId('accordion-trigger-item2');

    firstTrigger.focus();

    // Arrow down should move to next item
    await user.keyboard('{ArrowDown}');
    expect(secondTrigger).toHaveFocus();

    // Arrow up should move to previous item
    await user.keyboard('{ArrowUp}');
    expect(firstTrigger).toHaveFocus();
  });

  it('wraps navigation at boundaries', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const secondTrigger = screen.getByTestId('accordion-trigger-item2');

    firstTrigger.focus();

    // Arrow up from first item should go to last enabled item
    await user.keyboard('{ArrowUp}');
    expect(secondTrigger).toHaveFocus();

    // Arrow down from last enabled item should go to first item
    await user.keyboard('{ArrowDown}');
    expect(firstTrigger).toHaveFocus();
  });

  it('handles Home and End keys', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const secondTrigger = screen.getByTestId('accordion-trigger-item2');

    secondTrigger.focus();

    // Home should go to first enabled item
    await user.keyboard('{Home}');
    expect(firstTrigger).toHaveFocus();

    // End should go to last enabled item
    await user.keyboard('{End}');
    expect(secondTrigger).toHaveFocus();
  });

  it('toggles item with Enter and Space keys', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    firstTrigger.focus();

    // Enter should toggle
    await user.keyboard('{Enter}');
    expect(screen.getByText('First content')).toBeInTheDocument();

    // Space should toggle
    await user.keyboard(' ');
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
  });

  it('skips disabled items during keyboard navigation', async () => {
    const user = userEvent.setup();
    const itemsWithDisabled = [
      { id: 'item1', title: 'First Item', content: <div>First content</div> },
      {
        id: 'item2',
        title: 'Second Item',
        content: <div>Second content</div>,
        disabled: true,
      },
      { id: 'item3', title: 'Third Item', content: <div>Third content</div> },
    ];

    render(<Accordion items={itemsWithDisabled} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const thirdTrigger = screen.getByTestId('accordion-trigger-item3');

    firstTrigger.focus();

    // Arrow down should skip disabled item and go to third item
    await user.keyboard('{ArrowDown}');
    expect(thirdTrigger).toHaveFocus();
  });

  it('has proper ARIA attributes', () => {
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const firstContent = screen.getByTestId('accordion-content-item1');

    expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(firstTrigger).toHaveAttribute(
      'aria-controls',
      'accordion-content-item1'
    );
    expect(firstContent).toHaveAttribute('aria-hidden', 'true');
  });

  it('updates ARIA attributes when item is opened', async () => {
    const user = userEvent.setup();
    render(<Accordion {...defaultProps} />);

    const firstTrigger = screen.getByTestId('accordion-trigger-item1');
    const firstContent = screen.getByTestId('accordion-content-item1');

    await user.click(firstTrigger);

    expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(firstContent).toHaveAttribute('aria-hidden', 'false');
  });

  it('uses custom data-testid', () => {
    render(<Accordion {...defaultProps} data-testid="custom-accordion" />);

    expect(screen.getByTestId('custom-accordion')).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-accordion-trigger-item1')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-accordion-content-item1')
    ).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(<Accordion items={[]} />);

    expect(screen.getByTestId('accordion')).toBeInTheDocument();
    expect(screen.getByTestId('accordion')).toBeEmptyDOMElement();
  });
});
