import './SearchInput.css';

export default function SearchInput({ icon = '⌕', shortcut, className = '', ...rest }) {
  return (
    <div className={`search-input ${className}`}>
      <span className="search-input-icon">{icon}</span>
      <input {...rest} />
      {shortcut && <kbd className="search-input-kbd mono">{shortcut}</kbd>}
    </div>
  );
}
