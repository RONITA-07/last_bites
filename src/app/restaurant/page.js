"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ──────────────────────────────────────────────
   BOTTOM NAV
────────────────────────────────────────────── */
function BottomNav({ tab, setTab, router }) {
  return (
    <nav className="rd-nav">
      <button className={`rd-nav-item${tab==='home'?' rd-nav-item--active':''}`} onClick={()=>setTab('home')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </button>
      <button className={`rd-nav-item${tab==='add'?' rd-nav-item--active':''}`} onClick={()=>setTab('add')}>
        <div className="rd-nav-add-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span>Add</span>
      </button>
      <button className="rd-nav-item" onClick={()=>router.push('/restaurant/analytics')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Analytics</span>
      </button>
    </nav>
  );
}

/* ──────────────────────────────────────────────
   FOOD CARD
────────────────────────────────────────────── */
const CAT_ICONS = {
  meals: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  bakery: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  groceries: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z"/>
      <path d="M9 22v-4h4"/>
    </svg>
  ),
  beverages: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v20M18 2v20M6 12h12"/>
    </svg>
  ),
  other: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
};

const STATUS_CFG = {
  available: { label:'Live',    cls:'rd-badge--green' },
  sold:      { label:'Sold Out',cls:'rd-badge--blue'  },
  expired:   { label:'Expired', cls:'rd-badge--gray'  },
};

function FoodCard({ listing, onEdit }) {
  const sc = STATUS_CFG[listing.status] || STATUS_CFG.expired;
  const disc = listing.original_price > 0
    ? Math.round((1 - listing.price / listing.original_price) * 100)
    : 0;
  return (
    <div className="rd-food-card">
      <div className="rd-food-card__img">
        {listing.image
          ? <img src={listing.image} alt={listing.title} /> // eslint-disable-line
          : <div className="rd-food-card__placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>{CAT_ICONS[listing.category] || CAT_ICONS.other}</div>
        }
        {disc > 0 && <div className="rd-food-card__disc">-{disc}%</div>}
        <span className={`rd-badge ${sc.cls}`}>{sc.label}</span>
      </div>
      <div className="rd-food-card__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flexGrow: 1 }}>
            <p className="rd-food-card__name">{listing.title}</p>
            <p className="rd-food-card__cat" style={{ textTransform: 'capitalize' }}>{listing.category}</p>
          </div>
          <button 
            onClick={() => onEdit(listing)}
            type="button"
            className="rd-pill" 
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.72rem', 
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
        <div className="rd-food-card__footer" style={{ marginTop: '8px' }}>
          <div>
            <span className="rd-food-card__price">₹{Number(listing.price).toFixed(0)}</span>
            {listing.original_price > 0 &&
              <span className="rd-food-card__orig">₹{Number(listing.original_price).toFixed(0)}</span>
            }
          </div>
          <span className="rd-food-card__qty">Qty {listing.quantity}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TOAST
────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3200); return()=>clearTimeout(t); },[onClose]);
  return (
    <div className={`rd-toast ${toast.type==='success'?'rd-toast--ok':'rd-toast--err'}`}>
      {toast.type==='success'
        ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      }
      {toast.msg}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN
────────────────────────────────────────────── */
export default function RestaurantPage() {
  const router  = useRouter();
  const fileRef = useRef(null);

  const [user,     setUser]     = useState(null);
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('home');
  const [toast,    setToast]    = useState(null);
  const [filter,   setFilter]   = useState('all');

  const getTodayDateString = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
  };

  const getCurrentTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0].substring(0, 5);
  };

  /* form */
  const [img,      setImg]      = useState('');
  const [over,     setOver]     = useState(false);
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [price,    setPrice]    = useState('');
  const [orig,     setOrig]     = useState('');
  const [qty,      setQty]      = useState('1');
  const [cat,      setCat]      = useState('meals');
  const [prepDate, setPrepDate] = useState(getTodayDateString());
  const [prepTime, setPrepTime] = useState(getCurrentTimeString());
  const [saving,   setSaving]   = useState(false);
  const [step,     setStep]     = useState(1); // 1 or 2
  const [editingId, setEditingId] = useState(null);
  const [status,    setStatus]    = useState('available');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDesc('');
    setPrice('');
    setOrig('');
    setQty('1');
    setCat('meals');
    setImg('');
    setPrepDate(getTodayDateString());
    setPrepTime(getCurrentTimeString());
    setStatus('available');
    setStep(1);
  };

  const handleStartEdit = (listing) => {
    setEditingId(listing._id);
    setTitle(listing.title || '');
    setDesc(listing.description || '');
    setCat(listing.category || 'meals');
    setPrice(String(listing.price || ''));
    setOrig(String(listing.original_price || ''));
    setQty(String(listing.quantity || '1'));
    setStatus(listing.status || 'available');
    setImg(listing.image || '');
    
    if (listing.preparation_date) {
      setPrepDate(listing.preparation_date);
    } else {
      setPrepDate(getTodayDateString());
    }
    
    if (listing.preparation_time) {
      setPrepTime(listing.preparation_time);
    } else {
      setPrepTime(getCurrentTimeString());
    }
    
    setStep(1);
    setTab('add');
  };

  /* auth */
  useEffect(()=>{
    const raw = localStorage.getItem('decarb_user');
    if(!raw){ router.push('/?auth=login'); return; }
    const u = JSON.parse(raw);
    if(u.role!=='restaurant'){ router.push('/'); return; }
    setUser(u);
  },[router]);

  const load = async()=>{
    if(!user) return;
    setLoading(true);
    try{
      const r = await fetch(`http://localhost:5000/api/food/listings?restaurant_id=${user.id}`);
      if(r.ok) setListings(await r.json());
    }finally{ setLoading(false); }
  };
  useEffect(()=>{ if(user) load(); },[user]);

  const processFile = f=>{
    if(!f?.type.startsWith('image/')) return;
    if(f.size>5e6){ setToast({msg:'Image must be < 5 MB',type:'error'}); return; }
    const r=new FileReader(); r.onload=e=>setImg(e.target.result); r.readAsDataURL(f);
  };

  const publish = async e=>{
    e.preventDefault();
    if(!title.trim()){ setToast({msg:'Item name is required',type:'error'}); return; }
    setSaving(true);

    let calculatedPickup = new Date(Date.now() + 4 * 3600000).toISOString();
    if (prepDate && prepTime) {
      const prepDT = new Date(`${prepDate}T${prepTime}`);
      if (!isNaN(prepDT.getTime())) {
        // Set pickup deadline to 6 hours after preparation
        calculatedPickup = new Date(prepDT.getTime() + 6 * 3600000).toISOString();
      }
    }

    try{
      const url = editingId 
        ? `http://localhost:5000/api/food/listings/${editingId}`
        : 'http://localhost:5000/api/food/upload';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url,{
        method, headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          title, description:desc, restaurant_id:user.id,
          price:Number(price)||0, original_price:Number(orig)||0,
          quantity:Number(qty)||1, category:cat,
          pickup_time: calculatedPickup,
          preparation_date: prepDate,
          preparation_time: prepTime,
          image: img||undefined,
          status: editingId ? status : 'available'
        }),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Failed');
      setToast({msg: editingId ? 'Listing updated successfully!' : 'Listing is now live!', type:'success'});
      resetForm();
      load(); setTab('home');
    }catch(e){ setToast({msg:e.message,type:'error'}); }
    finally{ setSaving(false); }
  };

  const signOut=()=>{
    localStorage.removeItem('decarb_user'); localStorage.removeItem('decarb_token');
    window.dispatchEvent(new Event('auth-change')); router.push('/');
  };

  if(!user) return null;

  /* stats */
  const live    = listings.filter(l=>l.status==='available').length;
  const sold    = listings.filter(l=>l.status==='sold').length;
  const revenue = listings.reduce((s,l)=>s+(l.status==='sold'?Number(l.price):0),0);
  const co2     = sold*2.5;

  const filtered = filter==='all' ? listings : listings.filter(l=>l.status===filter);
  const hour     = new Date().getHours();
  const greeting = hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening';
  const greet    = greeting;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* ── RENDER ── */
  return (
    <div className="dash-main">
      {/* Title block */}
      <div className="dash-topbar" style={{ marginBottom: '8px' }}>
        <div>
          <h1 className="dash-page-title">Dashboard</h1>
          <p className="dash-page-sub">{today}</p>
        </div>
      </div>

      {/* ═══ HOME TAB ═══ */}
      {tab==='home' && (
        <>
          {/* Stats row */}
          <div className="kpi-row kpi-row--wide" style={{ marginBottom: '8px' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Live Listings</p>
                <h3 className="kpi-value" style={{ color: '#16a34a' }}>{live}</h3>
                <p className="kpi-sub">{listings.length} total listings</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#FEF3D6', color: '#B06000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Meals Sold</p>
                <h3 className="kpi-value" style={{ color: '#B06000' }}>{sold}</h3>
                <p className="kpi-sub">Rescue rate {listings.length > 0 ? Math.round((sold/listings.length)*100) : 0}%</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E3F2FD', color: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M17 12H7"/></svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">Revenue</p>
                <h3 className="kpi-value" style={{ color: '#1565C0' }}>₹{revenue.toFixed(0)}</h3>
                <p className="kpi-sub">From sold items</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E0F2F1', color: '#00695C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z"/><path d="M9 22v-4h4"/></svg>
              </div>
              <div className="kpi-body">
                <p className="kpi-label">CO₂ Saved</p>
                <h3 className="kpi-value" style={{ color: '#00695C' }}>{co2.toFixed(1)} kg</h3>
                <p className="kpi-sub">2.5 kg per meal</p>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="dash-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 className="card-title" style={{ margin: 0 }}>My Listings</h2>
                <button onClick={() => setTab('add')} className="btn-dash-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}>
                  + Add Surplus
                </button>
              </div>
              <div className="rd-filter-pills">
                {['all','available','sold','expired'].map(f=>(
                  <button key={f}
                    className={`rd-pill${filter===f?' rd-pill--on':''}`}
                    onClick={()=>setFilter(f)}>
                    {f==='all'?'All':f==='available'?'Live':f==='sold'?'Sold':'Expired'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="rd-skeleton-wrap">
                {[1,2,3].map(i=><div key={i} className="rd-skeleton"/>)}
              </div>
            ) : filtered.length===0 ? (
              <div className="rd-empty" style={{ padding: '40px 20px' }}>
                <div className="rd-empty__blob">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                </div>
                <p className="rd-empty__title">No listings yet</p>
                <p className="rd-empty__sub">Start reducing waste — add your first surplus item.</p>
                <button className="rd-cta-btn" onClick={()=>setTab('add')}>
                  + Create First Listing
                </button>
              </div>
            ) : (
              <div className="rd-grid">
                {filtered.map(l=><FoodCard key={l._id} listing={l} onEdit={handleStartEdit}/>)}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ ADD TAB ═══ */}
      {tab==='add' && (
        <div className="dash-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
          {/* Form header */}
          <div className="rd-form-head" style={{ marginBottom: '24px' }}>
            <button type="button" className="rd-back-btn" onClick={()=>{resetForm(); setTab('home');}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div>
              <h2 className="card-title">{editingId ? 'Edit Listing' : 'New Listing'}</h2>
              <p className="dash-page-sub" style={{ marginTop: '2px' }}>Step {step} of 2</p>
            </div>
            <div className="rd-steps">
              <div className={`rd-step-dot${step>=1?' rd-step-dot--on':''}`}/>
              <div className="rd-step-line"/>
              <div className={`rd-step-dot${step>=2?' rd-step-dot--on':''}`}/>
            </div>
          </div>

          <form onSubmit={publish} className="rd-form">

            {/* ── STEP 1: Photo + Basic Info ── */}
            {step===1 && (
              <div className="rd-form-step">
                {/* Photo */}
                <label className="rd-label">Food Photo</label>
                {img ? (
                  <div className="rd-photo-wrap">
                    <img src={img} alt="preview" className="rd-photo-preview"/> {/* eslint-disable-line */}
                    <button type="button" className="rd-photo-del"
                      onClick={()=>{setImg(''); if(fileRef.current)fileRef.current.value='';}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className={`rd-drop${over?' rd-drop--over':''}`}
                    onDragOver={e=>{e.preventDefault();setOver(true);}}
                    onDragLeave={()=>setOver(false)}
                    onDrop={e=>{e.preventDefault();setOver(false);processFile(e.dataTransfer.files[0]);}}
                    onClick={()=>fileRef.current?.click()}>
                    <div className="rd-drop__icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <p className="rd-drop__text">Tap to upload photo</p>
                    <p className="rd-drop__hint">PNG · JPG · max 5 MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                  onChange={e=>processFile(e.target.files[0])}/>

                {/* Item name */}
                <label className="rd-label" style={{marginTop:20}}>Item Name *</label>
                <input className="rd-input" type="text"
                  placeholder="e.g. Dal Makhani with Naan (2 servings)"
                  value={title} onChange={e=>setTitle(e.target.value)}/>

                {/* Description */}
                <label className="rd-label" style={{marginTop:16}}>Description</label>
                <textarea className="rd-input rd-input--ta" rows={3}
                  placeholder="What's in the box? Any allergens or reheating tips…"
                  value={desc} onChange={e=>setDesc(e.target.value)}/>

                {/* Category */}
                <label className="rd-label" style={{marginTop:16}}>Category</label>
                <div className="rd-cat-grid">
                  {[
                    {v:'meals',   icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, label:'Meals'},
                    {v:'bakery',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label:'Bakery'},
                    {v:'groceries',icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 9.8a7 7 0 0 1-7 8.2z"/><path d="M9 22v-4h4"/></svg>,label:'Groceries'},
                    {v:'beverages',icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M6 2v20M18 2v20M6 12h12"/></svg>,label:'Drinks'},
                    {v:'other',   icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, label:'Other'},
                  ].map(c=>(
                    <button key={c.v} type="button"
                      className={`rd-cat-chip${cat===c.v?' rd-cat-chip--on':''}`}
                      onClick={()=>setCat(c.v)}>
                      <span>{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>

                <button type="button" className="rd-next-btn" onClick={()=>{
                  if(!title.trim()){setToast({msg:'Item name is required',type:'error'});return;}
                  setStep(2);
                }}>
                  Next: Pricing & Pickup →
                </button>
              </div>
            )}

            {/* ── STEP 2: Price + Pickup ── */}
            {step===2 && (
              <div className="rd-form-step">
                {/* Price row */}
                <div className="rd-price-cards">
                  <div className="rd-price-card rd-price-card--rescue">
                    <label className="rd-label">Rescue Price</label>
                    <div className="rd-price-input">
                      <span>₹</span>
                      <input className="rd-input rd-input--bare" type="number" min="0" step="1"
                        placeholder="0" value={price} onChange={e=>setPrice(e.target.value)}/>
                    </div>
                    <p className="rd-price-hint">What customers pay</p>
                  </div>
                  <div className="rd-price-card rd-price-card--orig">
                    <label className="rd-label">Original Value</label>
                    <div className="rd-price-input">
                      <span>₹</span>
                      <input className="rd-input rd-input--bare" type="number" min="0" step="1"
                        placeholder="0" value={orig} onChange={e=>setOrig(e.target.value)}/>
                    </div>
                    <p className="rd-price-hint">Market price</p>
                    {orig && price && Number(orig)>Number(price) && (
                      <div className="rd-saving-badge">
                        {Math.round((1-Number(price)/Number(orig))*100)}% OFF
                      </div>
                    )}
                  </div>
                </div>

                {/* Qty */}
                <label className="rd-label" style={{marginTop:20}}>Quantity Available</label>
                <div className="rd-qty-row">
                  <button type="button" className="rd-qty-btn"
                    onClick={()=>setQty(q=>String(Math.max(1,Number(q)-1)))}>−</button>
                  <input className="rd-input rd-qty-input" type="number" min="1" value={qty}
                    onChange={e=>setQty(e.target.value)}/>
                  <button type="button" className="rd-qty-btn"
                    onClick={()=>setQty(q=>String(Number(q)+1))}>+</button>
                </div>

                {/* Preparation Date & Time */}
                <label className="rd-label" style={{marginTop:20}}>When was this food made?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
                    <input className="rd-input" type="date" value={prepDate} required
                      onChange={e=>setPrepDate(e.target.value)}/>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Time</label>
                    <input className="rd-input" type="time" value={prepTime} required
                      onChange={e=>setPrepTime(e.target.value)}/>
                  </div>
                </div>
                <p className="rd-field-hint">Helps customers know how fresh the food is.</p>

                {/* Status Selector (only visible when editing) */}
                {editingId && (
                  <div style={{ marginTop: '20px' }}>
                    <label className="rd-label">Listing Status</label>
                    <select 
                      className="rd-input" 
                      value={status} 
                      onChange={e=>setStatus(e.target.value)}
                      style={{ outline: 'none' }}
                    >
                      <option value="available">Live (Available)</option>
                      <option value="sold">Sold Out</option>
                      <option value="expired">Expired (Offline)</option>
                    </select>
                    <p className="rd-field-hint">Manage whether this listing is active for customers.</p>
                  </div>
                )}

                {/* Summary preview */}
                {title && (
                  <div className="rd-preview-card">
                    <div className="rd-preview-card__left">
                      <p className="rd-preview-card__name">{title}</p>
                      <p className="rd-preview-card__meta">Qty {qty} · {cat}</p>
                    </div>
                    <div className="rd-preview-card__right">
                      <p className="rd-preview-card__price">₹{price||0}</p>
                    </div>
                  </div>
                )}

                <div className="rd-form-btns">
                  <button type="button" className="rd-back-step-btn" onClick={()=>setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="rd-publish-btn" disabled={saving}>
                    {saving ? (
                      <span className="rd-spinner"/>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {editingId ? 'Update Listing' : 'Publish Listing'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && <Toast toast={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
