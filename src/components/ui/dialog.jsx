import { createContext, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'

const DialogContext = createContext({ open: false, onOpenChange: undefined })

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open ? children : null}
    </DialogContext.Provider>
  )
}

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within <Dialog>')
  }
  return context
}

export function DialogContent({ className = '', children }) {
  const { open, onOpenChange } = useDialogContext()

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="liquid-glass-dialog-backdrop" onClick={() => onOpenChange?.(false)}>
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogHeader({ className = '', ...props }) {
  return <div className={className} {...props} />
}

export function DialogFooter({ className = '', ...props }) {
  return <div className={className} {...props} />
}

export function DialogTitle({ className = '', ...props }) {
  return <h2 className={className} {...props} />
}

export function DialogDescription({ className = '', ...props }) {
  return <p className={className} {...props} />
}
