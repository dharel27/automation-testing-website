import React, { useState, useEffect } from 'react';
import { ValidationResult } from './validation';

interface FormCheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  validator?: (checked: boolean) => ValidationResult;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormCheckbox({
  id,
  name,
  label,
  checked,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  validator,
  helpText,
  className = '',
  'data-testid': testId,
}: FormCheckboxProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const hasError = touched && error;

  useEffect(() => {
    if (touched && validator) {
      const result = validator(checked);
      setError(result.isValid ? undefined : result.error);
    }
  }, [checked, validator, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError ? 'border-red-300' : ''
          }`}
          data-testid={testId || `${name}-checkbox`}
          aria-describedby={
            hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          aria-invalid={!!hasError}
          aria-required={required}
        />
        <div className="ml-3">
          <label
            htmlFor={id}
            className="text-sm text-gray-900 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {helpText && !hasError && (
            <p
              id={`${id}-help`}
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {helpText}
            </p>
          )}

          {hasError && (
            <p
              id={`${id}-error`}
              className="text-sm text-red-600 dark:text-red-400 mt-1"
              data-testid={`${name}-error`}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
