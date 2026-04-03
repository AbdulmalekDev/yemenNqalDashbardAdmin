import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SidebarItem = ({ item, isOpen, onToggle, onClick }) => {
  const location = useLocation();
  const Icon = item.icon;

  if (item.children) {
    const isChildActive = item.children.some(child => location.pathname === child.path);

    return (
      <div className="space-y-1">
        <button
          onClick={() => onToggle(item.id)}
          className={`w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${isChildActive ? 'text-primary-700 bg-primary-50/50' : ''}`}
        >
          <div className="flex items-center">
            {Icon && <Icon className="w-5 h-5 ml-3" />}
            <span className="text-base font-medium">{item.label}</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 ml-1" />}
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-60' : 'max-h-0'}`}>
          <div className="bg-gray-50/50 py-1">
            {item.children.map((child) => {
              const isChildActive = location.pathname === child.path;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center pr-14 pl-6 py-2 text-sm text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-colors duration-200 ${isChildActive ? 'text-primary-700 font-semibold' : ''}`}
                  onClick={onClick}
                >
                  <span className="text-sm font-normal">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isActive = location.pathname === item.path;
  return (
    <Link
      to={item.path}
      className={`flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${isActive ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-700' : ''}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-5 h-5 ml-3" />}
      <span className="text-base font-medium">{item.label}</span>
    </Link>
  );
};

export default SidebarItem;
