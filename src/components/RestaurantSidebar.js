"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/restaurant',           icon: '▪', label: 'Dashboard'   },
  { href: '/restaurant/analytics', icon: '▪', label: 'Analytics'   },
  { href: '/restaurant/orders',    icon: '▪', label: 'Operations'  },
];

export default function RestaurantSidebar({ user }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('decarb_user');
    localStorage.removeItem('decarb_token');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <aside className="dash-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Last Bite" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="sidebar-brand-name">Last Bite</div>
          <div className="sidebar-brand-sub">Restaurant Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {label === 'Dashboard'  && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                {label === 'Analytics'  && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                {label === 'Operations' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
              </span>
              <span>{label}</span>
              {active && <span className="sidebar-link-pip" />}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User + Logout */}
      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.name || user.email || 'R')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user.name || 'Restaurant'}</div>
              <div className="sidebar-user-role">Owner</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
