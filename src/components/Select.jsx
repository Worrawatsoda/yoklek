import { useRef } from 'react';

export function Select({ options, defaultLabel = "Select", value, onChange, ...props }) {
  const isControlled = value !== undefined;
  const ref = useRef(null);

  const handleChange = (e) => {
    e.target.style.color = 'var(--text-main)';
    if (onChange) onChange(e);
  };

  // For uncontrolled: use defaultValue; for controlled: use value
  const selectProps = isControlled
    ? { value, onChange: handleChange }
    : { defaultValue: '', onChange: handleChange };

  return (
    <select
      ref={ref}
      style={{ color: isControlled && value ? 'var(--text-main)' : 'var(--text-muted)' }}
      {...selectProps}
      {...props}
    >
      <option value="" disabled hidden>{defaultLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
