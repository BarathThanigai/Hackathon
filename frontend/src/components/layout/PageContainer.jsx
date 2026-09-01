import './PageContainer.css';

export default function PageContainer({ eyebrow, title, subtitle, actions, children, wide = false }) {
  return (
    <div className={`page ${wide ? 'page-wide' : ''}`}>
      {(title || actions) && (
        <div className="page-header">
          <div>
            {eyebrow && <div className="page-eyebrow mono">{eyebrow}</div>}
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
