import React, { useState, useEffect } from 'react';
import { ValidationResult } from './validation';

interface FormInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  validator?: (value: string) => ValidationResult;
  showPasswordToggle?: boolean;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormInput({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  validator,
  showPasswordToggle = false,
  helpText,
  className = '',
  'data-testid': testId,
}: FormInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const actualType = showPasswordToggle && showPassword ? 'text' : type;
  const hasError = touched && error;

  useEffect(() => {
    if (touched && validator) {
      const result = validator(value);
      setError(result.isValid ? undefined : result.error);
    }
  }, [value, validator, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

      <div className="relative">
        <input
          type={actualType}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          } ${showPasswordToggle ? 'pr-10' : ''}`}
          data-testid={testId || `${name}-input`}
          aria-describedby={
            hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          aria-invalid={!!hasError}
          aria-required={required}
        />

        {showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
            data-testid={`${name}-toggle-password`}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

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
