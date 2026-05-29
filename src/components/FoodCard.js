import { useState } from 'react';
import { useCart } from './CartContext';
import FloatingCard from './FloatingCard';

export default function FoodCard({ listing, userRole, loadingId, onOrder }) {
  const {
    _id, title, description, price, original_price,
    quantity, pickup_time, co2_saved, image, restaurant_id, distance, status
  } = listing;

  const [orderQty, setOrderQty] = useState(1);
  const [addedFlash, setAddedFlash] = useState(false);
  const { addItem, items } = useCart();

  const restaurantName = typeof restaurant_id === 'object' && restaurant_id ? restaurant_id.name : 'Partner Store';
  const isFree        = Number(price) === 0;
  const isAvailable   = status === 'available' && Number(quantity) > 0;
  const cartItem      = items.find(i => i.listing._id === _id);
  const inCart        = !!cartItem;

  const formattedTime = new Date(pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    + ' – ' + new Date(pickup_time).toLocaleDateString([], { month: 'short', day: 'numeric' });

  const formatPrepDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    return dateStr;
  };

  const handleAddToCart = () => {
    addItem(listing, orderQty);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1800);
  };

  return (
    <FloatingCard style={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }} className="card-img-zoom" />

        {/* CO2 tag */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(47,107,79,0.3)', backdropFilter: 'blur(4px)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z"/>
          </svg>
          -{co2_saved} kg CO₂
        </div>

        {/* Distance badge */}
        {distance !== undefined && (
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'var(--glass)', backdropFilter: 'blur(4px)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="12" r="3" /></svg>
            {distance} km away
          </div>
        )}

        {/* In-cart badge */}
        {inCart && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            ×{cartItem.qty} in cart
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>
            {restaurantName}
          </p>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', lineHeight: 1.2 }}>{title}</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>
            {description || 'No description provided.'}
          </p>

          {/* Logistics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', borderTop: '1px solid rgba(95,111,101,0.1)', paddingTop: '10px' }}>
            {(listing.preparation_date || listing.preparation_time) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 12h18" /><path d="M3 12a9 9 0 0 0 18 0" /><path d="M12 2v6" /></svg>
                Prepared: <strong>{formatPrepDate(listing.preparation_date)}{listing.preparation_time ? ` @ ${listing.preparation_time}` : ''}</strong>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Pickup: <strong>{formattedTime}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              Stock: <strong>{quantity} left</strong>
            </div>
          </div>
        </div>

        <div>
          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              {isFree ? (
                <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '5px 10px' }}>FREE DONATION</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{Number(price).toFixed(2)}</span>
                  <span style={{ fontSize: '0.88rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{Number(original_price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Qty selector */}
            {isAvailable && (userRole === 'customer') && Number(quantity) > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Qty:</span>
                <select value={orderQty} onChange={e => setOrderQty(Number(e.target.value))}
                  style={{ padding: '3px 7px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.82rem' }}>
                  {[...Array(Math.min(5, Number(quantity)))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action button */}
          {userRole === 'customer' ? (
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-danger'}`}
              style={{ width: '100%', padding: '12px', borderRadius: '16px', fontSize: '0.9rem', position: 'relative', overflow: 'hidden', transition: 'all 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {addedFlash ? 'Added to Cart!' : isAvailable ? (isFree ? 'Add Free Item' : 'Add to Cart') : (status === 'sold' ? 'Already Rescued' : 'Expired')}
            </button>
          ) : userRole === 'ngo' ? (
            <button
              onClick={() => onOrder && onOrder(_id)}
              disabled={!isAvailable || loadingId === _id}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-danger'}`}
              style={{ width: '100%', padding: '12px', borderRadius: '16px', fontSize: '0.9rem' }}
            >
              {loadingId === _id ? 'Processing...' : isAvailable ? 'Claim Donation' : (status === 'sold' ? 'Already Rescued' : 'Expired')}
            </button>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--accent)', padding: '10px', borderRadius: '12px', fontWeight: 500 }}>
              {status === 'available' ? 'Listing is Active' : `Status: ${status}`}
            </div>
          )}
        </div>
      </div>
    </FloatingCard>
  );
}
