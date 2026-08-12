import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string | null
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...rest }, ref) => {
    return (
      <div className="ui-field">
        {label && (
          <label className="ui-label" htmlFor={id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`}
          {...rest}
        />
        {error ? (
          <small className="ui-error">{error}</small>
        ) : (
          hint && <small className="ui-hint">{hint}</small>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
export default Input
