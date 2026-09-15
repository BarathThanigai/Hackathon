export default function IngestionSteps({
  steps,
  completedSteps,
  listClassName,
  itemClassName,
  markerClassName,
  completedClassName = 'done',
}) {
  return (
    <ul className={listClassName}>
      {steps.map((step) => {
        const completed = completedSteps.includes(step);

        return (
          <li
            key={step}
            className={`${itemClassName} ${completed ? completedClassName : ''}`.trim()}
          >
            <span className={markerClassName}>
              {completed ? '✓' : '·'}
            </span>

            {step}
          </li>
        );
      })}
    </ul>
  );
}