import type { ChangeEvent } from 'react';

export interface NordicHeaderProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  language?: string;
  systemStatus?: string;
  userLabel?: string;
}

export function NordicHeader({
  title,
  searchValue = '',
  onSearchChange,
  language = 'HU / EN',
  systemStatus = 'ONLINE',
  userLabel = 'DESIGNER',
}: NordicHeaderProps) {
  return (
    <header className="nordic-header" aria-label="DESIGNLY Nordic header">
      <div className="nordic-header-title" title={title}>
        {title}
      </div>

      <div className="nordic-header-search">
        <span className="nordic-header-search-rune" aria-hidden="true">ᛉ</span>
        <input
          value={searchValue}
          onChange={onSearchChange}
          className="nordic-header-input"
          placeholder="Search anything..."
          aria-label="Search anything"
        />
      </div>

      <div className="nordic-header-meta">
        <span className="nordic-header-status">
          <span className="nordic-header-status-dot" aria-hidden="true" />
          System: {systemStatus}
        </span>
        <span className="nordic-header-language">{language}</span>
        <div className="nordic-header-avatar" aria-label={userLabel}>
          <span aria-hidden="true">ᛟ</span>
        </div>
      </div>
    </header>
  );
}
