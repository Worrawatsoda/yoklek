import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Reusable dropdown for admin pages.
 * Props:
 *   label      — button label (string or node)
 *   icon       — optional icon before label
 *   options    — [{ value, label }]
 *   value      — current selected value (or array for multi)
 *   onChange   — (value) => void
 *   multi      — allow multi-select
 *   minWidth   — min-width of the menu (default 160)
 */
export default function Dropdown({ label, icon, options, value, onChange, multi = false, minWidth = 160 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const isSelected = (v) => multi ? (value || []).includes(v) : value === v;

  const handleClick = (v) => {
    if (multi) {
      const arr = value || [];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else {
      onChange(v);
      setOpen(false);
    }
  };

  // Display label
  const displayLabel = () => {
    if (multi && value?.length) return `${label} (${value.length})`;
    if (!multi && value) {
      const opt = options.find(o => o.value === value);
      return opt ? opt.label : label;
    }
    return label;
  };

  const hasActive = multi ? value?.length > 0 : !!value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          background: hasActive ? 'rgba(192,57,43,0.15)' : '#1a1a1a',
          border: `1px solid ${hasActive ? '#c0392b' : '#252525'}`,
          borderRadius: 8,
          color: hasActive ? '#e57e72' : '#888',
          fontSize: '0.8rem', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {icon && icon}
        {displayLabel()}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8,
          minWidth, padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                borderRadius: 6, color: isSelected(opt.value) ? '#fff' : '#aaa',
                fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left',
                background: isSelected(opt.value) ? 'rgba(192,57,43,0.15)' : 'none',
              }}
              onMouseEnter={e => { if (!isSelected(opt.value)) e.currentTarget.style.background = '#252525'; }}
              onMouseLeave={e => { if (!isSelected(opt.value)) e.currentTarget.style.background = 'none'; }}
            >
              {opt.label}
              {isSelected(opt.value) && <Check size={13} color="#c0392b" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
