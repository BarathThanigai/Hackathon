import { Link } from 'react-router-dom';

export default function RiskField({
  label,
  value,
  mono = false,
  to = null,
}) {
  const valueClassName = `risk-field-value ${mono ? 'mono' : ''}`.trim();

  return (
    <div className="risk-field">
      <div className="risk-field-label">{label}</div>

      {to ? (
        <Link className="risk-field-link" to={to}>
          {value}
        </Link>
      ) : (
        <div className={valueClassName}>
          {value}
        </div>
      )}
    </div>
  );
}