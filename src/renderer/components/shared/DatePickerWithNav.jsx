// src/renderer/components/shared/DatePickerWithNav.jsx
/**
 * DatePickerWithNav – wraps any TextField type="date" or type="datetime-local"
 * and adds ◀ / ▶ navigation arrows that step the date by exactly 1 day.
 *
 * Props (pass-through to TextField):
 *   value        – string in "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" format (or "")
 *   onChange     – (newValue: string) => void
 *   type         – "date" (default) | "datetime-local"
 *   min / max    – optional min/max date strings for boundary clamping
 *   ...rest      – any other TextField props (size, sx, label, etc.)
 */

import { useCallback, useEffect } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

// ── helpers ──────────────────────────────────────────────────────────────────

function extractDateStr(value) {
  if (!value) return null;
  if (value.includes('T')) return value.split('T')[0];
  return value;
}

function extractTimeSuffix(value) {
  if (!value) return '';
  const tIdx = value.indexOf('T');
  if (tIdx === -1) return '';
  return value.slice(tIdx);
}

function stepDate(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function clampDate(dateStr, min, max) {
  if (min && dateStr < min) return min;
  if (max && dateStr > max) return max;
  return dateStr;
}

function isInputFocused() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (active.isContentEditable) return true;
  // Ignore if focus is in DataGrid cells/editors
  if (active.classList.contains('MuiDataGrid-cell')) return true;
  if (active.getAttribute('role') === 'textbox' || active.getAttribute('role') === 'gridcell') return true;
  return false;
}

// ── styles ────────────────────────────────────────────────────────────────────

const NAV_BTN_SX = {
  width: 22,
  height: 22,
  p: 0,
  borderRadius: '6px',
  flexShrink: 0,
  color: 'text.secondary',
  '& svg': { fontSize: '1rem' },
  '&:hover': {
    bgcolor: 'action.hover',
    color: 'primary.main',
  },
  transition: 'color 0.15s, background-color 0.15s',
};

// ── main export ───────────────────────────────────────────────────────────────

export default function DatePickerWithNav({
  value,
  onChange,
  type = 'date',
  min,
  max,
  sx,
  ...rest
}) {
  const handleStep = useCallback(
    (delta) => {
      const dateStr = extractDateStr(value);
      if (!dateStr) return;
      const stepped = stepDate(dateStr, delta);
      const clamped = clampDate(stepped, min, max);
      if (type === 'datetime-local') {
        onChange(clamped + extractTimeSuffix(value));
      } else {
        onChange(clamped);
      }
    },
    [value, onChange, type, min, max],
  );

  const dateOnly = extractDateStr(value);
  const atMin = Boolean(min && dateOnly && dateOnly <= min);
  const atMax = Boolean(max && dateOnly && dateOnly >= max);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (isInputFocused()) return;

      e.preventDefault();
      if (e.key === 'ArrowLeft' && value && !atMin) {
        handleStep(-1);
      } else if (e.key === 'ArrowRight' && value && !atMax) {
        handleStep(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep, value, atMin, atMax]);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      <IconButton
        size="small"
        onClick={() => handleStep(-1)}
        disabled={!value || atMin}
        tabIndex={-1}
        sx={NAV_BTN_SX}
        aria-label="Lùi 1 ngày"
      >
        <ChevronLeftRoundedIcon />
      </IconButton>

      <TextField
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        sx={sx}
        {...rest}
      />

      <IconButton
        size="small"
        onClick={() => handleStep(1)}
        disabled={!value || atMax}
        tabIndex={-1}
        sx={NAV_BTN_SX}
        aria-label="Tiến 1 ngày"
      >
        <ChevronRightRoundedIcon />
      </IconButton>
    </Box>
  );
}

// ── variant for raw <input type="date"> (no MUI TextField) ───────────────────

/**
 * DateInputWithNav – same UX but wraps a plain HTML input[type="date"].
 * For use where native CSS-module inputs are preferred (Mapping > EmployeeDialog).
 *
 * onChange signature: (e) => void  (standard DOM event object)
 */
export function DateInputWithNav({ value, onChange, className, min, max, ...rest }) {
  const handleStep = useCallback(
    (delta) => {
      const dateStr = extractDateStr(value);
      if (!dateStr) return;
      const stepped = stepDate(dateStr, delta);
      const clamped = clampDate(stepped, min, max);
      onChange({ target: { value: clamped } });
    },
    [value, onChange, min, max],
  );

  const dateOnly = extractDateStr(value);
  const atMin = Boolean(min && dateOnly && dateOnly <= min);
  const atMax = Boolean(max && dateOnly && dateOnly >= max);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (isInputFocused()) return;

      e.preventDefault();
      if (e.key === 'ArrowLeft' && value && !atMin) {
        handleStep(-1);
      } else if (e.key === 'ArrowRight' && value && !atMax) {
        handleStep(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep, value, atMin, atMax]);

  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '4px',
    color: '#64748b',
    flexShrink: 0,
    lineHeight: 1,
    fontSize: 16,
    transition: 'color 0.15s',
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <button
        type="button"
        style={{ ...btnStyle, opacity: !value || atMin ? 0.35 : 1 }}
        disabled={!value || atMin}
        onClick={() => handleStep(-1)}
        tabIndex={-1}
        aria-label="Lùi 1 ngày"
      >
        ‹
      </button>
      <input
        type="date"
        value={value ?? ''}
        onChange={onChange}
        className={className}
        min={min}
        max={max}
        {...rest}
      />
      <button
        type="button"
        style={{ ...btnStyle, opacity: !value || atMax ? 0.35 : 1 }}
        disabled={!value || atMax}
        onClick={() => handleStep(1)}
        tabIndex={-1}
        aria-label="Tiến 1 ngày"
      >
        ›
      </button>
    </span>
  );
}
