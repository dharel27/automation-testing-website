import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  type: 'product' | 'user';
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({
  onSearch,
  placeholder = 'Search products, users...',
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 1) {
        fetchSuggestions(query.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const [productsResponse, usersResponse] = await Promise.all([
        axios.get(
          `http://localhost:3001/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=5`
        ),
        axios.get(`http://localhost:3001/api/users?limit=5`),
      ]);

      const productSuggestions: SearchSuggestion[] = productsResponse.data.data
        .filter((product: any) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          type: 'product' as const,
        }));

      const userSuggestions: SearchSuggestion[] = usersResponse.data.data
        .filter(
          (user: any) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.profile.firstName + ' ' + user.profile.lastName)
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
        .map((user: any) => ({
          id: user.id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          category: user.username,
          type: 'user' as const,
        }));

      setSuggestions([...productSuggestions, ...userSuggestions].slice(0, 8));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    onSearch(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div
      ref={searchRef}
      className="relative w-full max-w-2xl mx-auto"
      data-testid="search-bar-container"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 1 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-12 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            data-testid="search-input"
            aria-label="Search"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
            }
          />

          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Loading Spinner or Search Button */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isLoading ? (
              <div
                className="animate-spin h-5 w-5 text-blue-500"
                data-testid="search-loading"
                aria-label="Loading suggestions"
              >
                <svg fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <button
                type="submit"
                className="text-gray-400 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors"
                data-testid="search-submit-button"
                aria-label="Submit search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          data-testid="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              id={`suggestion-${index}`}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              } transition-colors`}
              onClick={() => handleSuggestionClick(suggestion)}
              data-testid={`search-suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {suggestion.category}
                  </div>
                </div>
                <div className="ml-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      suggestion.type === 'product'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {suggestion.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        query.length > 1 && (
          <div
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4"
            data-testid="search-no-results"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          </div>
        )}
    </div>
  );
};

export default SearchBar;
