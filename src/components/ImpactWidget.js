"use client";
import { useEffect, useState } from 'react';
import FloatingCard from './FloatingCard';
import { API_BASE_URL } from '@/utils/api';

export default function ImpactWidget({ userId, restaurantId, refreshTrigger }) {
  const [stats, setStats] = useState({ mealsRescued: 0, co2Saved: 0, revenueRecovered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        let url = `${API_BASE_URL}/api/analytics/stats`;
        const params = [];
        if (userId) params.push(`user_id=${userId}`);
        if (restaurantId) params.push(`restaurant_id=${restaurantId}`);
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userId, restaurantId, refreshTrigger]);

  // Calculate tree equivalents: roughly 1 tree absorbs 20 kg of CO2 per year
  const treeEquivalent = stats.co2Saved > 0 ? (stats.co2Saved / 20.0).toFixed(1) : '0';

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '30px',
        color: 'var(--text-secondary)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div className="animate-float">Analyzing environmental impact...</div>
      </div>
    );
  }

  const isRestaurant = !!restaurantId;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      width: '100%',
      marginBottom: '30px'
    }}>
      {/* Metric 1: Meals Rescued */}
      <FloatingCard style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '24px',
        backgroundColor: 'var(--surface)'
      }}>
        <div style={{
          background: 'var(--accent)',
          borderRadius: '16px',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Zm0 0v4"/></svg>
        </div>
        <div>
          <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>
            {stats.mealsRescued}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Meals Rescued
          </p>
        </div>
      </FloatingCard>

      {/* Metric 2: CO2 Saved */}
      <FloatingCard style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '24px',
        backgroundColor: 'var(--surface)'
      }}>
        <div style={{
          background: '#E1F5FE',
          borderRadius: '16px',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0288D1'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z"/><path d="M9 22v-4h4"/></svg>
        </div>
        <div>
          <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0288D1', lineHeight: 1.1 }}>
            {stats.co2Saved} <span style={{ fontSize: '1rem', fontWeight: 600 }}>kg</span>
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            CO₂ Saved
          </p>
        </div>
      </FloatingCard>

      {/* Metric 3: Custom Role-Based Counter (Revenue Recovered vs. Tree Equivalents) */}
      <FloatingCard style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '24px',
        backgroundColor: 'var(--surface)'
      }}>
        {isRestaurant ? (
          <>
            <div style={{
              background: '#FFF3E0',
              borderRadius: '16px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E65100'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8V6"/><path d="M12 18v-2"/><path d="M16 12H12.5a1.5 1.5 0 0 1 0-3H15"/><path d="M8 12h3.5a1.5 1.5 0 0 0 0 3H14"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#E65100', lineHeight: 1.1 }}>
                ₹{stats.revenueRecovered.toFixed(2)}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Revenue Recovered
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{
              background: '#E8F5E9',
              borderRadius: '16px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2E7D32'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 9h4v10h10V9h4L12 2z"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2E7D32', lineHeight: 1.1 }}>
                {treeEquivalent}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Tree absorption equiv. (yr)
              </p>
            </div>
          </>
        )}
      </FloatingCard>
    </div>
  );
}
