"use client";

export default function SearchBar({ value, onChange, placeholder = "Search for surplus meals, groceries, bakery..." }) {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto 24px auto'
    }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          paddingLeft: '48px',
          paddingRight: '20px',
          boxShadow: 'var(--shadow-soft)',
          fontSize: '1rem',
          height: '54px',
          borderRadius: '16px'
        }}
      />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </div>
  );
}
