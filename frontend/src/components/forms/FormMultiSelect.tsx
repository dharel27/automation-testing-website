import React, { useState, useEffect, useRef } from 'react';
import { ValidationResult } from './validation';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormMultiSelectProps {
  id: string;
  name: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  onBlur?: () => void;
  options: MultiSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxSelections?: number;
  validator?: (values: string[]) => ValidationResult;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormMultiSelect({
  id,
  name,
  label,
  values,
  onChange,
  onBlur,
  options,
  placeholder = 'Select options',
  required = false,
  disabled = false,
  maxSelections,
  validator,
  helpText,
  className = '',
  'data-testid': testId,
}: FormMultiSelectProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasError = touched && error;
  const selectedOptions = options.filter((option) =>
    values.includes(option.value)
  );
  const canSelectMore = !maxSelections || values.length < maxSelections;

  useEffect(() => {
    if (touched && validator) {
      const result = validator(values);
      setError(result.isValid ? undefined : result.error);
    }
  }, [values, validator, touched]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue));
    } else if (canSelectMore) {
      onChange([...values, optionValue]);
    }
  };

  const handleRemoveOption = (optionValue: string) => {
    onChange(values.filter((v) => v !== optionValue));
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} options selected`;

  return (
    <div className={`space-y-1 ${className}`} ref={dropdownRef}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {maxSelections && (
          <span className="text-xs text-gray-500 ml-2">
            (max {maxSelections})
          </span>
        )}
      </label>

      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
          data-testid={testId || `${name}-multiselect`}
          aria-describedby={
            hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          aria-invalid={!!hasError}
          aria-required={required}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center justify-between">
            <span
              className={selectedOptions.length === 0 ? 'text-gray-500' : ''}
            >
              {displayText}
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="py-1" role="listbox">
              {options.map((option) => {
                const isSelected = values.includes(option.value);
                const isDisabled =
                  disabled ||
                  option.disabled ||
                  (!isSelected && !canSelectMore);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      !isDisabled && handleToggleOption(option.value)
                    }
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-300'
                    }`}
                    data-testid={`${name}-option-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && (
                        <svg
                          className="h-4 w-4 text-blue-600 dark:text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected options display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemoveOption(option.value)}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                data-testid={`${name}-remove-${option.value}`}
                aria-label={`Remove ${option.label}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {helpText && !hasError && (
        <p
          id={`${id}-help`}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}

      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          data-testid={`${name}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
