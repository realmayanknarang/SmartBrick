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
function TabBar({ tabs = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!tabs || tabs.length === 0) return null;

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
              onClick={() => setActiveIdx(idx)}
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
