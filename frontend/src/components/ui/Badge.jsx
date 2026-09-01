import './Badge.css';

// tone: neutral | document | github | meeting | success | warn | danger | accent
export default function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
