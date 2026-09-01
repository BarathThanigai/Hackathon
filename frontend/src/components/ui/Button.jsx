import './Button.css';

export default function Button({
  children,
  variant = 'primary', // primary | secondary | ghost
  size = 'md', // md | sm
  icon,
  iconAfter,
  ...rest
}) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...rest}>
      {icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>
      {iconAfter && <span className="btn-icon-after">{iconAfter}</span>}
    </button>
  );
}
