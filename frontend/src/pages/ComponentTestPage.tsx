import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import { Accordion } from '../components/ui/Accordion';
import { Carousel } from '../components/ui/Carousel';

export const ComponentTestPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accordionItems = [
    {
      id: 'item1',
      title: 'First Item',
      content: <div>This is the first accordion item content.</div>,
    },
    {
      id: 'item2',
      title: 'Second Item',
      content: <div>This is the second accordion item content.</div>,
    },
    {
      id: 'item3',
      title: 'Third Item (Disabled)',
      content: <div>This content should not be accessible.</div>,
      disabled: true,
    },
  ];

  const carouselItems = [
    {
      id: 'slide1',
      content: (
        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl">
          Slide 1
        </div>
      ),
      alt: 'First slide',
    },
    {
      id: 'slide2',
      content: (
        <div className="w-full h-full bg-green-500 flex items-center justify-center text-white text-2xl">
          Slide 2
        </div>
      ),
      alt: 'Second slide',
    },
    {
      id: 'slide3',
      content: (
        <div className="w-full h-full bg-red-500 flex items-center justify-center text-white text-2xl">
          Slide 3
        </div>
      ),
      alt: 'Third slide',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">UI Components Test Page</h1>

      {/* Modal Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal Component</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Modal
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="md"
        >
          <div className="space-y-4">
            <p>This is a test modal with various interactive elements.</p>
            <button className="px-3 py-1 bg-gray-200 rounded">Button 1</button>
            <button className="px-3 py-1 bg-gray-200 rounded ml-2">
              Button 2
            </button>
            <input
              type="text"
              placeholder="Test input"
              className="block w-full mt-2 p-2 border rounded"
            />
          </div>
        </Modal>
      </section>

      {/* Tooltip Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tooltip Component</h2>
        <div className="space-x-4">
          <Tooltip content="This tooltip appears on hover" trigger="hover">
            <button className="px-4 py-2 bg-green-500 text-white rounded">
              Hover me
            </button>
          </Tooltip>
          <Tooltip content="This tooltip appears on focus" trigger="focus">
            <button className="px-4 py-2 bg-yellow-500 text-white rounded">
              Focus me
            </button>
          </Tooltip>
          <Tooltip
            content="This tooltip appears on both"
            trigger="both"
            position="bottom"
          >
            <button className="px-4 py-2 bg-purple-500 text-white rounded">
              Hover or focus me
            </button>
          </Tooltip>
        </div>
      </section>

      {/* Accordion Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accordion Component</h2>
        <div className="max-w-md">
          <Accordion items={accordionItems} allowMultiple={false} />
        </div>
        <div className="max-w-md mt-4">
          <h3 className="text-lg font-medium mb-2">Multiple Items Allowed:</h3>
          <Accordion items={accordionItems} allowMultiple={true} />
        </div>
      </section>

      {/* Carousel Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Carousel Component</h2>
        <div className="max-w-2xl">
          <Carousel
            items={carouselItems}
            autoPlay={true}
            autoPlayInterval={3000}
            showDots={true}
            showArrows={true}
            infinite={true}
          />
        </div>
        <div className="max-w-2xl mt-4">
          <h3 className="text-lg font-medium mb-2">No Autoplay:</h3>
          <Carousel
            items={carouselItems}
            autoPlay={false}
            showDots={true}
            showArrows={true}
            infinite={false}
          />
        </div>
      </section>
    </div>
  );
};
