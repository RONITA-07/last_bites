"use client";

export default function CTAButtons({ onSelectRole }) {
  const roles = [
    { 
      id: 'customer', 
      label: "I'm a Customer", 
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2h1l1.5 9h11l1.5-9H21" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M5.5 11h13" />
        </svg>
      ), 
      desc: 'Rescue delicious surplus meals at great discounts' 
    },
    { 
      id: 'restaurant', 
      label: "I'm a Restaurant", 
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      ), 
      desc: 'List excess food, cut waste, and recover lost revenue' 
    },
    { 
      id: 'ngo', 
      label: "I'm an NGO", 
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ), 
      desc: 'Claim free food donations for communities in need' 
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      justifyContent: 'center',
      marginTop: '40px',
      width: '100%',
      maxWidth: '1000px'
    }}>
      {roles.map((role) => (
        <div
          key={role.id}
          onClick={() => onSelectRole(role.id)}
          className="floating-card hover-lift"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '30px 24px',
            width: '280px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.7)',
            transition: 'var(--transition-bounce)'
          }}
        >
          <span style={{ 
            fontSize: '3rem',
            lineHeight: 1
          }}>{role.icon}</span>
          
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            color: 'var(--primary)',
            marginTop: '8px'
          }}>
            {role.label}
          </h3>
          
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            {role.desc}
          </p>
          
          <span className="badge badge-success" style={{
            marginTop: '12px',
            fontSize: '0.7rem',
            fontWeight: 700
          }}>
            Get Started &rarr;
          </span>
        </div>
      ))}
    </div>
  );
}
