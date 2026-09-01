import './Card.css';

export default function Card({ children, className = '', interactive = false, as: As = 'div', ...rest }) {
  return (
    <As className={`card ${interactive ? 'card-interactive' : ''} ${className}`} {...rest}>
      {children}
    </As>
  );
}
