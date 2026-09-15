import './Timeline.css';
import { Link } from 'react-router-dom';

export default function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((step, i) => (
        <li key={i} className="timeline-step">
          <div className="timeline-marker">
            <span className="timeline-dot" />
            {i < steps.length - 1 && <span className="timeline-line" />}
          </div>
          {typeof step === 'object' && step.destination ? (
            <Link className="timeline-label" to={step.destination}>
              {step.label}
            </Link>
          ) : (
            <span className="timeline-label">
              {typeof step === 'string' ? step : step.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
