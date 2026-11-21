import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <input ref={ref} className={`input ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''} ${className}`} {...props} />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
});

export default Input;
