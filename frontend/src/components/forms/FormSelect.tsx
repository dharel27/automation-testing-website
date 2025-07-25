import React, { useState, useEffect } from 'react';
import { ValidationResult } from './validation';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validator?: (value: string) => ValidationResult;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  validator,
  helpText,
  className = '',
  'data-testid': testId,
}: FormSelectProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const hasError = touched && error;

  useEffect(() => {
    if (touched && validator) {
      const result = validator(value);
      setError(result.isValid ? undefined : result.error);
    }
  }, [value, validator, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        }`}
        data-testid={testId || `${name}-select`}
        aria-describedby={
          hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
        aria-invalid={!!hasError}
        aria-required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

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
