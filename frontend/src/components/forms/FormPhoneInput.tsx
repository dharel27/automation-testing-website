import React, { useState, useEffect } from 'react';
import {
  validatePhoneNumber,
  formatPhoneNumber,
  unformatPhoneNumber,
} from './validation';

interface FormPhoneInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function FormPhoneInput({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '(555) 123-4567',
  required = false,
  disabled = false,
  className = '',
  'data-testid': testId,
}: FormPhoneInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const hasError = touched && error;

  useEffect(() => {
    if (touched) {
      const result = validatePhoneNumber(value);
      setError(result.isValid ? undefined : result.error);
    }
  }, [value, touched]);

  useEffect(() => {
    setDisplayValue(formatPhoneNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const unformatted = unformatPhoneNumber(inputValue);

    // Limit to 10 digits for US phone numbers
    if (unformatted.length <= 10) {
      onChange(unformatted);
      setDisplayValue(formatPhoneNumber(unformatted));
    }
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

      <input
        type="tel"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="tel"
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        }`}
        data-testid={testId || `${name}-input`}
        aria-describedby={hasError ? `${id}-error` : undefined}
        aria-invalid={!!hasError}
        aria-required={required}
      />

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
