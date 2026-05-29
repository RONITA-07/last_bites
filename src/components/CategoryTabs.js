"use client";

export default function CategoryTabs({ activeCategory, onSelect }) {
  const categories = [
    { id: 'all', label: 'All Foods' },
    { id: 'meals', label: 'Surplus Meals' },
    { id: 'bakery', label: 'Fresh Bakery' },
    { id: 'groceries', label: 'Groceries' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'other', label: 'Other Deals' }
  ];

  const getIcon = (id) => {
    switch (id) {
      case 'all':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'meals':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v3M9 2v3M15 2v3M3 10h18a1 1 0 0 1 1 1v2a8 8 0 0 1-16 0v-2a1 1 0 0 1 1-1z" />
          </svg>
        );
      case 'bakery':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5l-5 5M7 5l5 5M17 10l-5 5M7 10l5 5M17 15l-5 5M7 15l5 5" />
          </svg>
        );
      case 'groceries':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
        );
      case 'beverages':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8h12L16 22H8L6 8zM9 2h6M12 2v6" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      overflowX: 'auto',
      padding: '4px 4px 16px 4px',
      marginBottom: '24px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      justifyContent: 'center'
    }}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="btn"
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
              color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
              border: isActive ? 'none' : '1px solid var(--border)',
              boxShadow: isActive ? '0 6px 15px rgba(47, 107, 79, 0.15)' : 'var(--shadow-soft)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getIcon(cat.id)}</span>
            <span style={{ fontWeight: isActive ? 700 : 500 }}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
