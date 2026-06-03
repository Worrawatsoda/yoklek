export function Input({ type = "text", placeholder, onChange, style, value, defaultValue, ...props }) {
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  // For date inputs: show muted color when empty (works for both controlled & uncontrolled)
  const isEmpty = type === "date" && (value === '' || value === undefined);
  const currentStyle = isEmpty ? { color: 'var(--text-muted)', ...style } : style;

  const inputProps = value !== undefined
    ? { value, onChange: handleChange }          // controlled
    : { defaultValue, onChange: handleChange };  // uncontrolled

  return (
    <input
      type={type}
      placeholder={placeholder}
      style={currentStyle}
      {...inputProps}
      {...props}
    />
  );
}
