import './AsyncState.css';

export default function AsyncState({
  status,
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
}) {
  if (status === 'loading') {
    return (
      <div className="async-state" role="status" aria-live="polite">
        <div className="async-state-indicator async-state-spinner" />
        <div>
          <div className="async-state-title">{title || 'Loading…'}</div>
          {message && <p className="async-state-message">{message}</p>}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="async-state async-state-error" role="alert">
        <div className="async-state-indicator">!</div>
        <div className="async-state-content">
          <div className="async-state-title">{title || 'Something went wrong'}</div>
          {message && <p className="async-state-message">{message}</p>}
          {onRetry && (
            <button
              type="button"
              className="async-state-retry"
              onClick={onRetry}
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="async-state" role="status">
        <div className="async-state-indicator">—</div>
        <div>
          <div className="async-state-title">{title || 'Nothing here yet'}</div>
          {message && <p className="async-state-message">{message}</p>}
        </div>
      </div>
    );
  }

  return null;
}