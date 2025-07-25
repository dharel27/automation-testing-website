import React, { useState, useEffect } from 'react';
import { ValidationResult } from './validation';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  helpText?: string;
}

interface FormRadioGroupProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: RadioOption[];
  required?: boolean;
  disabled?: boolean;
  validator?: (value: string) => ValidationResult;
  helpText?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormRadioGroup({
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  required = false,
  disabled = false,
  validator,
  helpText,
  className = '',
  'data-testid': testId,
}: FormRadioGroupProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

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

  return (
    <fieldset className={`space-y-3 ${className}`}>
      <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </legend>

      {helpText && !hasError && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      <div
        className="space-y-2"
        data-testid={testId || `${name}-radio-group`}
        role="radiogroup"
        aria-invalid={!!hasError}
        aria-required={required}
      >
        {options.map((option, index) => (
          <div key={option.value} className="flex items-start">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled || option.disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`${name}-${option.value}-radio`}
            />
            <div className="ml-3">
              <label
                htmlFor={`${name}-${option.value}`}
                className="text-sm text-gray-900 dark:text-gray-300"
              >
                {option.label}
              </label>
              {option.helpText && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {option.helpText}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasError && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          data-testid={`${name}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
