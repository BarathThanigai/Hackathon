import './Timeline.css';

export default function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((step, i) => (
        <li key={i} className="timeline-step">
          <div className="timeline-marker">
            <span className="timeline-dot" />
            {i < steps.length - 1 && <span className="timeline-line" />}
          </div>
          <span className="timeline-label">{typeof step === 'string' ? step : step.label}</span>
        </li>
      ))}
    </ol>
  );
}
