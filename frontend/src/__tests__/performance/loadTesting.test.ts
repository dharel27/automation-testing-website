import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Performance testing utilities
interface PerformanceTestResult {
  operation: string;
  duration: number;
  memoryUsage?: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

class PerformanceTester {
  private results: PerformanceTestResult[] = [];

  async measureOperation(
    name: string,
    operation: () => Promise<void> | void,
    iterations: number = 100
  ): Promise<PerformanceTestResult> {
    const times: number[] = [];
    const startMemory = this.getMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const endMemory = this.getMemoryUsage();
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: PerformanceTestResult = {
      operation: name,
      duration: totalTime,
      memoryUsage: endMemory - startMemory,
      iterations,
      averageTime,
      minTime,
      maxTime,
    };

    this.results.push(result);
    return result;
  }

  private getMemoryUsage(): number {
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize : 0;
  }

  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  clear(): void {
    this.results = [];
  }

  generateReport(): string {
    let report = 'Performance Test Report\n';
    report += '========================\n\n';

    this.results.forEach((result) => {
      report += `Operation: ${result.operation}\n`;
      report += `Iterations: ${result.iterations}\n`;
      report += `Total Duration: ${result.duration.toFixed(2)}ms\n`;
      report += `Average Time: ${result.averageTime.toFixed(2)}ms\n`;
      report += `Min Time: ${result.minTime.toFixed(2)}ms\n`;
      report += `Max Time: ${result.maxTime.toFixed(2)}ms\n`;
      if (result.memoryUsage) {
        report += `Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      }
      report += '\n';
    });

    return report;
  }
}

// Mock large dataset generation
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    description: `Description for item ${index + 1}`,
    value: Math.floor(Math.random() * 1000),
    category: `Category ${Math.floor(index / 100) + 1}`,
    active: Math.random() > 0.5,
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    tags: [`tag-${index % 10}`, `category-${Math.floor(index / 100) + 1}`],
    metadata: {
      priority: ['low', 'medium', 'high'][index % 3],
      complexity: Math.floor(Math.random() * 10) + 1,
      lastModified: new Date().toISOString(),
    },
  }));
};

// Mock search and filter operations
const searchDataset = (dataset: any[], query: string) => {
  const lowerQuery = query.toLowerCase();
  return dataset.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
  );
};

const filterDataset = (dataset: any[], filters: any) => {
  return dataset.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.activeOnly && !item.active) return false;
    if (filters.priority && item.metadata.priority !== filters.priority)
      return false;
    if (item.value < filters.minValue || item.value > filters.maxValue)
      return false;
    return true;
  });
};

const sortDataset = (
  dataset: any[],
  field: string,
  direction: 'asc' | 'desc'
) => {
  return [...dataset].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    return direction === 'desc' ? -comparison : comparison;
  });
};

const paginateDataset = (
  dataset: any[],
  page: number,
  itemsPerPage: number
) => {
  const startIndex = (page - 1) * itemsPerPage;
  return dataset.slice(startIndex, startIndex + itemsPerPage);
};

describe('Performance and Load Testing', () => {
  let tester: PerformanceTester;

  beforeEach(() => {
    tester = new PerformanceTester();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    console.log(tester.generateReport());
  });

  describe('Large Dataset Generation', () => {
    it('should generate 1000 items efficiently', async () => {
      const result = await tester.measureOperation(
        'Generate 1000 items',
        () => {
          const dataset = generateLargeDataset(1000);
          expect(dataset).toHaveLength(1000);
        },
        10
      );

      expect(result.averageTime).toBeLessThan(50); // Should take less than 50ms on average
    });

    it('should generate 5000 items within acceptable time', async () => {
      const result = await tester.measureOperation(
        'Generate 5000 items',
        () => {
          const dataset = generateLargeDataset(5000);
          expect(dataset).toHaveLength(5000);
        },
        5
      );

      expect(result.averageTime).toBeLessThan(200); // Should take less than 200ms on average
    });

    it('should generate 10000 items within acceptable time', async () => {
      const result = await tester.measureOperation(
        'Generate 10000 items',
        () => {
          const dataset = generateLargeDataset(10000);
          expect(dataset).toHaveLength(10000);
        },
        3
      );

      expect(result.averageTime).toBeLessThan(500); // Should take less than 500ms on average
    });
  });

  describe('Search Performance', () => {
    let largeDataset: any[];

    beforeEach(() => {
      largeDataset = generateLargeDataset(5000);
    });

    it('should search through 5000 items efficiently', async () => {
      const result = await tester.measureOperation(
        'Search 5000 items',
        () => {
          const results = searchDataset(largeDataset, 'Item 1');
          expect(results.length).toBeGreaterThan(0);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(20); // Should take less than 20ms on average
    });

    it('should handle complex search queries', async () => {
      const result = await tester.measureOperation(
        'Complex search 5000 items',
        () => {
          const results = searchDataset(largeDataset, 'Category 1');
          expect(results.length).toBeGreaterThan(0);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(30);
    });

    it('should handle search with no results efficiently', async () => {
      const result = await tester.measureOperation(
        'Search with no results',
        () => {
          const results = searchDataset(largeDataset, 'nonexistent-item-xyz');
          expect(results).toHaveLength(0);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(25);
    });
  });

  describe('Filtering Performance', () => {
    let largeDataset: any[];

    beforeEach(() => {
      largeDataset = generateLargeDataset(5000);
    });

    it('should filter by category efficiently', async () => {
      const result = await tester.measureOperation(
        'Filter by category',
        () => {
          const results = filterDataset(largeDataset, {
            category: 'Category 1',
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });
          expect(results.length).toBeGreaterThan(0);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(15);
    });

    it('should filter by multiple criteria efficiently', async () => {
      const result = await tester.measureOperation(
        'Filter by multiple criteria',
        () => {
          const results = filterDataset(largeDataset, {
            category: 'Category 1',
            minValue: 100,
            maxValue: 500,
            activeOnly: true,
            priority: 'high',
          });
          expect(results).toBeDefined();
        },
        50
      );

      expect(result.averageTime).toBeLessThan(25);
    });

    it('should handle value range filtering efficiently', async () => {
      const result = await tester.measureOperation(
        'Filter by value range',
        () => {
          const results = filterDataset(largeDataset, {
            minValue: 250,
            maxValue: 750,
            activeOnly: false,
          });
          expect(results).toBeDefined();
        },
        50
      );

      expect(result.averageTime).toBeLessThan(20);
    });
  });

  describe('Sorting Performance', () => {
    let largeDataset: any[];

    beforeEach(() => {
      largeDataset = generateLargeDataset(5000);
    });

    it('should sort by ID efficiently', async () => {
      const result = await tester.measureOperation(
        'Sort by ID',
        () => {
          const sorted = sortDataset(largeDataset, 'id', 'asc');
          expect(sorted[0].id).toBeLessThan(sorted[sorted.length - 1].id);
        },
        20
      );

      expect(result.averageTime).toBeLessThan(50);
    });

    it('should sort by name efficiently', async () => {
      const result = await tester.measureOperation(
        'Sort by name',
        () => {
          const sorted = sortDataset(largeDataset, 'name', 'asc');
          expect(sorted[0].name).toBeDefined();
        },
        20
      );

      expect(result.averageTime).toBeLessThan(60);
    });

    it('should sort by value efficiently', async () => {
      const result = await tester.measureOperation(
        'Sort by value',
        () => {
          const sorted = sortDataset(largeDataset, 'value', 'desc');
          expect(sorted[0].value).toBeGreaterThanOrEqual(sorted[1].value);
        },
        20
      );

      expect(result.averageTime).toBeLessThan(50);
    });
  });

  describe('Pagination Performance', () => {
    let largeDataset: any[];

    beforeEach(() => {
      largeDataset = generateLargeDataset(10000);
    });

    it('should paginate large dataset efficiently', async () => {
      const result = await tester.measureOperation(
        'Paginate 10000 items (50 per page)',
        () => {
          const page1 = paginateDataset(largeDataset, 1, 50);
          const page10 = paginateDataset(largeDataset, 10, 50);
          const page100 = paginateDataset(largeDataset, 100, 50);

          expect(page1).toHaveLength(50);
          expect(page10).toHaveLength(50);
          expect(page100).toHaveLength(50);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(5); // Should be very fast
    });

    it('should handle different page sizes efficiently', async () => {
      const result = await tester.measureOperation(
        'Different page sizes',
        () => {
          const small = paginateDataset(largeDataset, 1, 25);
          const medium = paginateDataset(largeDataset, 1, 100);
          const large = paginateDataset(largeDataset, 1, 200);

          expect(small).toHaveLength(25);
          expect(medium).toHaveLength(100);
          expect(large).toHaveLength(200);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(5);
    });
  });

  describe('Combined Operations Performance', () => {
    let largeDataset: any[];

    beforeEach(() => {
      largeDataset = generateLargeDataset(5000);
    });

    it('should handle search + filter + sort + paginate efficiently', async () => {
      const result = await tester.measureOperation(
        'Combined operations',
        () => {
          // Search
          let results = searchDataset(largeDataset, 'Item');

          // Filter
          results = filterDataset(results, {
            category: 'Category 1',
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });

          // Sort
          results = sortDataset(results, 'value', 'desc');

          // Paginate
          const page = paginateDataset(results, 1, 50);

          expect(page.length).toBeLessThanOrEqual(50);
        },
        20
      );

      expect(result.averageTime).toBeLessThan(100); // Combined operations should still be fast
    });

    it('should handle worst-case scenario efficiently', async () => {
      const result = await tester.measureOperation(
        'Worst-case combined operations',
        () => {
          // Search with many results
          let results = searchDataset(largeDataset, 'a'); // Common letter

          // Filter with loose criteria
          results = filterDataset(results, {
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });

          // Sort by string field (slower)
          results = sortDataset(results, 'name', 'asc');

          // Large page size
          const page = paginateDataset(results, 1, 200);

          expect(page.length).toBeLessThanOrEqual(200);
        },
        10
      );

      expect(result.averageTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const initialMemory = tester['getMemoryUsage']();

      const result = await tester.measureOperation(
        'Repeated dataset generation',
        () => {
          for (let i = 0; i < 10; i++) {
            const dataset = generateLargeDataset(1000);
            // Simulate processing
            const filtered = filterDataset(dataset, {
              minValue: 0,
              maxValue: 1000,
              activeOnly: false,
            });
            expect(filtered).toBeDefined();
          }
        },
        5
      );

      const finalMemory = tester['getMemoryUsage']();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large datasets without excessive memory usage', async () => {
      const result = await tester.measureOperation(
        'Large dataset memory test',
        () => {
          const dataset = generateLargeDataset(10000);
          const searched = searchDataset(dataset, 'Item');
          const filtered = filterDataset(searched, {
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });
          const sorted = sortDataset(filtered, 'id', 'asc');

          expect(sorted).toBeDefined();
        },
        3
      );

      // Should not use excessive memory
      if (result.memoryUsage) {
        expect(result.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const dataset = generateLargeDataset(2000);

      const result = await tester.measureOperation(
        'Concurrent operations',
        async () => {
          const promises = [
            Promise.resolve(searchDataset(dataset, 'Item 1')),
            Promise.resolve(
              filterDataset(dataset, {
                category: 'Category 1',
                minValue: 0,
                maxValue: 1000,
                activeOnly: false,
              })
            ),
            Promise.resolve(sortDataset(dataset, 'value', 'desc')),
            Promise.resolve(paginateDataset(dataset, 1, 100)),
          ];

          const results = await Promise.all(promises);
          expect(results).toHaveLength(4);
          results.forEach((result) => expect(result).toBeDefined());
        },
        10
      );

      expect(result.averageTime).toBeLessThan(150);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty datasets efficiently', async () => {
      const emptyDataset: any[] = [];

      const result = await tester.measureOperation(
        'Empty dataset operations',
        () => {
          const searched = searchDataset(emptyDataset, 'test');
          const filtered = filterDataset(emptyDataset, {
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });
          const sorted = sortDataset(emptyDataset, 'id', 'asc');
          const paginated = paginateDataset(emptyDataset, 1, 50);

          expect(searched).toHaveLength(0);
          expect(filtered).toHaveLength(0);
          expect(sorted).toHaveLength(0);
          expect(paginated).toHaveLength(0);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(1); // Should be extremely fast
    });

    it('should handle single item datasets efficiently', async () => {
      const singleItemDataset = generateLargeDataset(1);

      const result = await tester.measureOperation(
        'Single item dataset operations',
        () => {
          const searched = searchDataset(singleItemDataset, 'Item 1');
          const filtered = filterDataset(singleItemDataset, {
            minValue: 0,
            maxValue: 1000,
            activeOnly: false,
          });
          const sorted = sortDataset(singleItemDataset, 'id', 'asc');
          const paginated = paginateDataset(singleItemDataset, 1, 50);

          expect(searched.length).toBeLessThanOrEqual(1);
          expect(filtered.length).toBeLessThanOrEqual(1);
          expect(sorted).toHaveLength(1);
          expect(paginated).toHaveLength(1);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(2);
    });
  });
});
