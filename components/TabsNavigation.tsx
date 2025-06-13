import React from 'react';
import { TabDefinition, TabId } from '../types';

interface TabsNavigationProps {
  tabs: TabDefinition[];
  activeTabId: TabId;
  onTabChange: (tabId: TabId) => void;
}

const TabsNavigation: React.FC<TabsNavigationProps> = ({ tabs, activeTabId, onTabChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-around bg-blue-100 border-b border-gray-300 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-3.5 px-3 w-full sm:w-auto sm:flex-1 text-center cursor-pointer transition-all duration-200 ease-in-out font-medium text-sm 
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-100 focus-visible:ring-blue-500
            ${activeTabId === tab.id 
              ? 'bg-blue-200 text-blue-800 border-b-2 sm:border-b-2 border-blue-600 shadow-inner' 
              : 'bg-blue-50 text-gray-700 hover:bg-blue-200 hover:text-blue-700 border-b-2 sm:border-b-0 border-transparent' // Added transparent border for consistent height
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabsNavigation;