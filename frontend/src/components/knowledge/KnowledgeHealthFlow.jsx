import './KnowledgeHealthFlow.css';

const STAGES = ['Documents', 'Decisions', 'People', 'Technologies', 'Relationships'];

export default function KnowledgeHealthFlow() {
  return (
    <div className="health-flow">
      {STAGES.map((stage, i) => (
        <div className="health-flow-stage" key={stage}>
          <div className="health-flow-node">{stage}</div>
          {i < STAGES.length - 1 && <div className="health-flow-connector" aria-hidden="true">→</div>}
        </div>
      ))}
    </div>
  );
}
