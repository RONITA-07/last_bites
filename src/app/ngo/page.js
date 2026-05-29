"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryTabs from '@/components/CategoryTabs';
import FoodCard from '@/components/FoodCard';
import ImpactWidget from '@/components/ImpactWidget';
import FloatingCard from '@/components/FloatingCard';

export default function NGOPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Dashboard states
  const [donations, setDonations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  // Refresh and action states
  const [refreshStats, setRefreshStats] = useState(0);
  const [claimLoadingId, setClaimLoadingId] = useState(null);
  const [toast, setToast] = useState({ text: '', type: '' });
  const [updateStatusLoadingId, setUpdateStatusLoadingId] = useState(null);

  // Authentication check
  useEffect(() => {
    const stored = localStorage.getItem('decarb_user');
    if (!stored) {
      router.push('/?auth=login');
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== 'ngo') {
      router.push('/');
      return;
    }
    setUser(u);
  }, [router]);

  // Fetch available donations (items with price = 0)
  const fetchDonations = async () => {
    if (!user) return;
    setLoadingDonations(true);
    try {
      let url = `http://localhost:5000/api/food/listings?lat=${user.location.lat}&lng=${user.location.lng}&type=donation`;
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  // Fetch claims made by this NGO
  const fetchNGOClaims = async () => {
    if (!user) return;
    setLoadingClaims(true);
    try {
      const res = await fetch(`http://localhost:5000/api/order/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Run fetches
  useEffect(() => {
    if (user) {
      fetchDonations();
      fetchNGOClaims();
    }
  }, [user, category, search]);

  // Claim a free donation listing
  const handleClaimDonation = async (foodId, qty = 1) => {
    if (!user) return;
    setClaimLoadingId(foodId);
    setToast({ text: '', type: '' });

    try {
      const res = await fetch('http://localhost:5000/api/order/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          food_id: foodId,
          quantity: qty // Claim everything or 1 unit by default
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim donation');
      }

      setToast({
        text: `Donation claimed! Coordinate with the restaurant for pickup.`,
        type: 'success'
      });

      // Update available local list
      setDonations(prev => prev.map(item => {
        if (item._id === foodId) {
          const remaining = Number(item.quantity) - qty;
          return {
            ...item,
            quantity: remaining,
            status: remaining === 0 ? 'sold' : 'available'
          };
        }
        return item;
      }));

      // Refresh claims and impact
      fetchNGOClaims();
      setRefreshStats(prev => prev + 1);
    } catch (err) {
      setToast({ text: err.message, type: 'error' });
    } finally {
      setClaimLoadingId(null);
      setTimeout(() => setToast({ text: '', type: '' }), 5000);
    }
  };

  // Progress Claim Logistics (e.g. Claimed -> Picked Up -> Distributed)
  const handleUpdateClaimStatus = async (orderId, nextStatus) => {
    setUpdateStatusLoadingId(orderId);
    try {
      const res = await fetch('http://localhost:5000/api/order/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status: nextStatus
        })
      });

      if (res.ok) {
        fetchNGOClaims();
        setRefreshStats(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to update claim status:', err);
    } finally {
      setUpdateStatusLoadingId(null);
    }
  };

  if (!user) return null;

  return (
    <main className="page-container">
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        animation: 'slideUpFade 0.5s ease-out'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
          NGO Surplus Redistribution Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Claim free food donations listed by local businesses and track distribution to community members.
        </p>
      </div>

      {/* Toast Alert */}
      {toast.text && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? 'var(--primary)' : '#C5221F',
          color: '#FFFFFF',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-hover)',
          zIndex: 2000,
          fontWeight: 600,
          fontSize: '0.95rem',
          maxWidth: '400px',
          animation: 'slideUpFade 0.3s ease-out'
        }}>
          {toast.text}
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6b4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
            <path d="M9 22v-4" />
          </svg>
          NGO Environmental Impact Metrics
        </h2>
        <ImpactWidget userId={user.id} refreshTrigger={refreshStats} />
      </div>

      {/* Main Grid: Available Donations and logistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '32px',
        alignItems: 'start',
        marginBottom: '40px'
      }}>
        
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            Available Donations Nearby
          </h2>

          <div style={{ marginBottom: '24px' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search for stores or donation items..." />
            <CategoryTabs activeCategory={category} onSelect={setCategory} />
          </div>

          {loadingDonations ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '40px 0', textAlign: 'center' }}>
              Searching local partners for free food donations...
            </div>
          ) : donations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: 'var(--text-secondary)',
              background: 'var(--glass)',
              backdropFilter: 'blur(4px)',
              borderRadius: '24px',
              border: '1px dashed var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginTop: '12px', color: 'var(--primary)' }}>No active free donations found</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                All nearby meals are currently claimed. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {donations.map(item => (
                <FoodCard
                  key={item._id}
                  listing={item}
                  onOrder={handleClaimDonation}
                  userRole={user.role}
                  loadingId={claimLoadingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Claimed Logistics Tracking */}
        <FloatingCard style={{ padding: '30px', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid rgba(95,111,101,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            Claimed Pickups & Deliveries
          </h3>

          {loadingClaims ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '10px 0' }}>Loading claim records...</div>
          ) : claims.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '10px 0' }}>
              You have not claimed any donations yet. Click &quot;Claim Donation&quot; on available items to rescue them.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {claims.map(claim => {
                const isClaimed = claim.status === 'placed';
                const isPicked = claim.status === 'picked';
                const isCompleted = claim.status === 'completed';
                
                const foodItem = claim.food_id || {};
                const restName = typeof foodItem.restaurant_id === 'object' && foodItem.restaurant_id
                  ? foodItem.restaurant_id.name 
                  : 'Partner Store';

                return (
                  <div 
                    key={claim._id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {foodItem.title || 'Donated Surplus'}
                      </span>
                      <span className={`badge ${
                        isCompleted ? 'badge-success' : isPicked ? 'badge-info' : 'badge-warning'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {claim.status === 'placed' ? 'Claimed' : claim.status === 'picked' ? 'In Transit' : 'Distributed'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Store: <strong>{restName}</strong> | Quantity: <strong>{claim.quantity}</strong>
                    </p>

                    {/* Progress tracking actions */}
                    {!isCompleted && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {isClaimed && (
                          <button
                            disabled={updateStatusLoadingId === claim._id}
                            onClick={() => handleUpdateClaimStatus(claim._id, 'picked')}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                          >
                            {updateStatusLoadingId === claim._id ? 'Updating...' : 'Mark Picked Up'}
                          </button>
                        )}
                        {isPicked && (
                          <button
                            disabled={updateStatusLoadingId === claim._id}
                            onClick={() => handleUpdateClaimStatus(claim._id, 'completed')}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                          >
                            {updateStatusLoadingId === claim._id ? 'Updating...' : 'Mark as Distributed'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </FloatingCard>

      </div>
    </main>
  );
}
