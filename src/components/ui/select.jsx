import { Children, Fragment, cloneElement, isValidElement } from 'react'

function extractText(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }
  if (!isValidElement(node)) {
    return ''
  }
  return extractText(node.props.children)
}

export function Select({ value = '', onValueChange, disabled, children }) {
  let triggerClassName = ''
  let placeholder = 'Select an option'
  const options = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === SelectTrigger) {
      triggerClassName = child.props.className || ''
      Children.forEach(child.props.children, (grandChild) => {
        if (isValidElement(grandChild) && grandChild.type === SelectValue && grandChild.props.placeholder) {
          placeholder = grandChild.props.placeholder
        }
      })
    }
    if (child.type === SelectContent) {
      Children.forEach(child.props.children, (option) => {
        if (!isValidElement(option) || option.type !== SelectItem) return
        options.push({
          value: option.props.value,
          label: extractText(option.props.children)
        })
      })
    }
  })

  const showPlaceholder = value === '' || value === undefined || value === null

  return (
    <select
      className={triggerClassName}
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
      disabled={disabled}
    >
      {showPlaceholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function SelectTrigger({ children }) {
  return <Fragment>{children}</Fragment>
}

export function SelectValue({ placeholder }) {
  return <Fragment>{placeholder}</Fragment>
}

export function SelectContent({ children }) {
  return <Fragment>{children}</Fragment>
}

export function SelectItem({ children }) {
  return <Fragment>{children}</Fragment>
}
