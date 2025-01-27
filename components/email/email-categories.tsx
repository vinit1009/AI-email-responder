"use client";

import { useState } from 'react';
import { Inbox, Tag, Bell, Users, Mail, ShoppingBag } from 'lucide-react';

interface CategoryTabProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const CategoryTab = ({ icon, label, active, onClick }: CategoryTabProps) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2.5 transition-all duration-200
                ${active 
                  ? 'text-black' 
                  : 'text-neutral-500 hover:text-neutral-800'}`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
    )}
  </button>
);

interface EmailCategoriesProps {
  emails: any[];
  onCategoryChange: (category: string) => void;
  loading?: boolean;
  categoryEmails?: Record<string, any[]>;
}

export function EmailCategories({ 
  onCategoryChange, 
  loading = false,
}: EmailCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState('CATEGORY_PERSONAL');

  const categories = [
    {
      id: 'CATEGORY_PERSONAL',
      label: 'Personal',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'CATEGORY_UPDATES',
      label: 'Updates',
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: 'CATEGORY_PROMOTIONS',
      label: 'Promotions',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 'CATEGORY_SOCIAL',
      label: 'Social',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'all',
      label: 'All Mail',
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  return (
    <div className="border-b border-neutral-200">
      <div className="max-w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center px-2 min-w-max">
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              icon={category.icon}
              label={category.label}
              active={activeCategory === category.id}
              onClick={() => {
                setActiveCategory(category.id);
                onCategoryChange(category.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 