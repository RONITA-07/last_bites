"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ──────────────────────────────────────────────
   CUSTOM TOOLTIP
────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ra2-tip">
      <p>{label}</p>
      <p className="ra2-tip__val">₹{Number(payload[0].value).toFixed(0)}</p>
    </div>
  );
};

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
function buildTrend(orders) {
  const map = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt || Date.now())
      .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    map[d] = (map[d] || 0) + Number(o.total_price || 0);
  });
  return Object.entries(map)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-14)
    .map(([date, v]) => ({ date, v: +v.toFixed(0) }));
}

function buildWeek(orders) {
  const D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rev = Array(7).fill(0);
  orders.forEach(o => {
    const wd = (new Date(o.createdAt || Date.now()).getDay() + 6) % 7;
    rev[wd] += Number(o.total_price || 0);
  });
  return D.map((d, i) => ({ d, v: +rev[i].toFixed(0) }));
}

/* ──────────────────────────────────────────────
   MAIN
────────────────────────────────────────────── */
export default function RestaurantAnalyticsPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('decarb_user');
    if (!raw) { router.push('/?auth=login'); return; }
    const u = JSON.parse(raw);
    if (u.role !== 'restaurant') { router.push('/restaurant'); return; }
    setUser(u);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [o, l] = await Promise.all([
          fetch(`http://localhost:5000/api/order/restaurant/${user.id}`),
          fetch(`http://localhost:5000/api/food/listings?restaurant_id=${user.id}`),
        ]);
        if (o.ok) setOrders(await o.json());
        if (l.ok) setListings(await l.json());
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (!user) return null;

  /* metrics */
  const totalRev   = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
  const totalItems = orders.reduce((s, o) => s + Number(o.quantity || 0), 0);
  const avgOrder   = orders.length ? totalRev / orders.length : 0;
  const fulfilled  = orders.filter(o => o.status === 'completed').length;
  const pending    = orders.filter(o => o.status === 'placed').length;
  const co2        = totalItems * 2.5;

  const trend  = buildTrend(orders);
  const week   = buildWeek(orders);
  const month  = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  /* top item */
  const topItem = listings.reduce((top, l) => {
    const rev = orders.filter(o => (o.food_id?._id || o.food_id) === l._id)
      .reduce((s, o) => s + Number(o.total_price || 0), 0);
    return rev > (top?.rev || 0) ? { ...l, rev } : top;
  }, null);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dash-main">
      {/* Title block */}
      <div className="dash-topbar" style={{ marginBottom: '8px' }}>
        <div>
          <h1 className="dash-page-title">Analytics</h1>
          <p className="dash-page-sub">{today}</p>
        </div>
      </div>

      {loading ? (
        <div className="ra2-loading">
          <div className="ra2-spinner"/>
          <p>Loading your analytics…</p>
        </div>
      ) : (
        <>
          {/* KPI ROW */}
          <div className="kpi-row kpi-row--wide" style={{ marginBottom: '8px' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E3F2FD', color: '#1565C0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Total Revenue</p>
                <h3 className="kpi-value" style={{ color: '#1565C0' }}>₹{totalRev.toFixed(0)}</h3>
                <p className="kpi-sub">{orders.length} orders (avg ₹{avgOrder.toFixed(0)})</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#F3E5F5', color: '#7B1FA2' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Rescued Items</p>
                <h3 className="kpi-value" style={{ color: '#7B1FA2' }}>{totalItems}</h3>
                <p className="kpi-sub">Across all sales</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#FEF3D6', color: '#B06000' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Pending Orders</p>
                <h3 className="kpi-value" style={{ color: '#B06000' }}>{pending}</h3>
                <p className="kpi-sub">Awaiting collection</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Completed</p>
                <h3 className="kpi-value" style={{ color: '#16a34a' }}>{fulfilled}</h3>
                <p className="kpi-sub">Orders fulfilled</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row" style={{ marginBottom: '8px' }}>
            {/* AREA CHART */}
            <div className="dash-card">
              <div className="card-header" style={{ marginBottom: '18px' }}>
                <div>
                  <h3 className="card-title">Revenue Trend</h3>
                  <p className="dash-page-sub" style={{ marginTop: '2px' }}>Last 14 days</p>
                </div>
                {trend.length > 0 && (
                  <div className="ra2-trend-arrow">
                    {trend[trend.length-1]?.v >= (trend[0]?.v||0)
                      ? <span style={{color:'#16a34a', fontWeight: 'bold'}}>▲ Up</span>
                      : <span style={{color:'#dc2626', fontWeight: 'bold'}}>▼ Down</span>
                    }
                  </div>
                )}
              </div>

              {trend.length === 0 ? (
                <div className="chart-empty">No orders yet — data will appear here</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#16a34a" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                      interval="preserveStartEnd"/>
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `₹${v}`}/>
                    <Tooltip content={<Tip />}/>
                    <Area dataKey="v" name="Revenue" stroke="#16a34a" strokeWidth={2.5}
                      fill="url(#areaGrad)" dot={false}
                      activeDot={{ r: 5, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* WEEKLY BARS */}
            <div className="dash-card">
              <div className="card-header" style={{ marginBottom: '18px' }}>
                <div>
                  <h3 className="card-title">Weekly Performance</h3>
                  <p className="dash-page-sub" style={{ marginTop: '2px' }}>Revenue by day</p>
                </div>
              </div>
              {week.every(d => d.v === 0) ? (
                <div className="chart-empty">No activity this week</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={week} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="d" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `₹${v}`}/>
                    <Tooltip formatter={v => [`₹${v}`, 'Revenue']}/>
                    <Bar dataKey="v" fill="#f59e0b" radius={[6, 6, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* TWO COLUMN ECO + TOP PERFORMER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '8px' }}>
            {/* Eco impact */}
            <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: '#E0F2F1', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00695C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
                  <path d="M9 22v-4" />
                </svg>
              </div>
              <div>
                <p className="kpi-label">Eco Impact</p>
                <h3 className="kpi-value" style={{ color: '#00695C' }}>{co2.toFixed(1)} kg CO₂</h3>
                <p className="kpi-sub">Prevented (≈ {(co2/21).toFixed(1)} trees)</p>
              </div>
            </div>

            {/* Top performer */}
            <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: '#FFF3E0', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
                </svg>
              </div>
              <div>
                <p className="kpi-label">Best Performer</p>
                {topItem ? (
                  <>
                    <h3 className="kpi-value" style={{ color: '#E65100', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{topItem.title}</h3>
                    <p className="kpi-sub">Revenue: <strong>₹{topItem.rev.toFixed(0)}</strong> ({topItem.category})</p>
                  </>
                ) : (
                  <p className="kpi-sub">No sales data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* RECENT ORDERS */}
          {orders.length > 0 && (
            <div className="dash-card">
              <div className="card-header" style={{ marginBottom: '18px' }}>
                <h3 className="card-title">Recent Orders</h3>
                <span className="card-badge">{orders.length} total</span>
              </div>
              <div className="ra2-order-list">
                {[...orders].reverse().slice(0, 6).map(o => (
                  <div key={o._id} className="ra2-order-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.food_id?.title || 'Item'}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9AA0A6', marginTop: '2px' }}>Quantity: {o.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>₹{Number(o.total_price).toFixed(0)}</p>
                      <span className={`status-pill status-pill--${o.status}`} style={{ display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', marginTop: '3px' }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
