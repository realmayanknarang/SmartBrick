/**
 * client/src/components/TabBar.jsx
 *
 * Reusable TabBar component — Phase 13 UI Fixes
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a horizontal tab row with underline styling and renders active content.
 */

import { useState } from 'react';
import './TabBar.css';

/**
 * @param {object} props
 * @param {Array<{ label: string, content: React.ReactNode }>} props.tabs
 */
function TabBar({ tabs = [], activeTab, onChange }) {
  const [localActiveIdx, setLocalActiveIdx] = useState(0);
  const isControlled = activeTab !== undefined;
  const activeIdx = isControlled ? activeTab : localActiveIdx;

  if (!tabs || tabs.length === 0) return null;

  const handleTabClick = (idx) => {
    if (onChange) {
      onChange(idx);
    }
    if (!isControlled) {
      setLocalActiveIdx(idx);
    }
  };

  return (
    <div className="tab-bar-container">
      {/* Tab headers */}
      <div className="tab-bar__row" role="tablist">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`tab-bar__tab ${isActive ? 'tab-bar__tab--active' : ''}`}
              onClick={() => handleTabClick(idx)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div className="tab-bar__content" role="tabpanel">
        {tabs[activeIdx]?.content}
      </div>
    </div>
  );
}

export default TabBar;
