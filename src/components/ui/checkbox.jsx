import { forwardRef } from 'react'

export const Checkbox = forwardRef(function Checkbox(
  { id, checked = false, onCheckedChange, className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={className}
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  )
})
