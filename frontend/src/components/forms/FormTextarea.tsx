import React, { useState, useEffect } from 'react';
import { ValidationResult } from './validation';

interface FormTextareaProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  validator?: (value: string) => ValidationResult;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormTextarea({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  validator,
  helpText,
  className = '',
  'data-testid': testId,
}: FormTextareaProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const hasError = touched && error;
  const characterCount = value.length;
  const showCharacterCount = maxLength !== undefined;

  useEffect(() => {
    if (touched && validator) {
      const result = validator(value);
      setError(result.isValid ? undefined : result.error);
    }
  }, [value, validator, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (!maxLength || newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {showCharacterCount && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {characterCount}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-vertical ${
          hasError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        }`}
        data-testid={testId || `${name}-textarea`}
        aria-describedby={
          hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
        aria-invalid={!!hasError}
        aria-required={required}
      />

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
