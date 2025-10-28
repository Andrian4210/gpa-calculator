export function Button({ asChild, className = '', variant, ...props }) {
  const Component = asChild ? 'span' : 'button'
  return <Component className={className} {...props} />
}
