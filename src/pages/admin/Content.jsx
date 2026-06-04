import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  Plus, Pencil, XCircle, Play, RotateCcw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import Dropdown from './Dropdown';
import { API } from '../../lib/api';
const tk   = () => localStorage.getItem('token');
const CATS = ['Arm','Chest','Leg','Back','Shoulder'];

/* ─── helpers ──────────────────────────────────────────── */
function PgBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',
      borderRadius:6,border:'none',cursor:disabled?'default':'pointer',
      background:active?'#c0392b':'#1e1e1e',
      color:disabled?'#333':active?'#fff':'#888',
      fontSize:'0.8rem',fontWeight:active?700:400,
    }}>{children}</button>
  );
}

/* ─── View panel ────────────────────────────────────────── */
function ViewPanel({ ex, onBack, onEdit }) {
  const ytId = ex.youtubeVideoId;
  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div className="adm-section-card" style={{ padding:'1.5rem', position:'relative' }}>
        {/* back */}
        <button onClick={onBack} style={{ position:'absolute',top:'1.2rem',left:'1.2rem',background:'#252525',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',gap:4,fontSize:'0.8rem' }}>
          <ChevronLeft size={16}/>
        </button>

        <h2 style={{ textAlign:'center',margin:'0 0 1.5rem',fontSize:'1.2rem',fontWeight:700 }}>{ex.name}</h2>

        {/* Video + add slot */}
        <div style={{ display:'flex',gap:12,justifyContent:'center',marginBottom:'1.5rem',alignItems:'center' }}>
          <div style={{ position:'relative',width:260,background:'#111',borderRadius:12,overflow:'hidden',aspectRatio:'16/9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            {ytId ? (
              <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                style={{ position:'absolute',inset:0,width:'100%',height:'100%' }}
                frameBorder="0" allowFullScreen title={ex.name} />
            ) : (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,color:'#444' }}>
                <Play size={32}/><span style={{fontSize:'0.75rem'}}>ดูวีดีโอสาธิต</span>
              </div>
            )}
          </div>
          <button onClick={onEdit} style={{ width:36,height:36,borderRadius:'50%',background:'#252525',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',flexShrink:0 }}>
            <Plus size={18}/>
          </button>
        </div>

        {/* Info grid */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {/* วิธีเล่น */}
          <div style={{ background:'#141414',borderRadius:10,padding:'1rem' }}>
            <p style={{ fontSize:'0.75rem',color:'#888',margin:'0 0 6px' }}>วิธีเล่น</p>
            {ex.steps?.length > 0
              ? <ol style={{ paddingLeft:'1.2rem',margin:0,display:'flex',flexDirection:'column',gap:4 }}>
                  {ex.steps.map((s,i) => <li key={i} style={{ fontSize:'0.8rem',color:'#ccc',lineHeight:1.5 }}>{s}</li>)}
                </ol>
              : <p style={{ fontSize:'0.8rem',color:'#555',margin:0 }}>{ex.description || '-'}</p>
            }
          </div>

          {/* คำเตือน */}
          {ex.warnings?.length > 0 && (
            <div style={{ background:'#3d0a0a',borderRadius:10,padding:'1rem' }}>
              <p style={{ fontSize:'0.75rem',color:'#e53e3e',margin:'0 0 6px',display:'flex',alignItems:'center',gap:4 }}>
                <AlertTriangle size={13}/> คำเตือนเพื่อป้องกันการบาดเจ็บ
              </p>
              <ul style={{ paddingLeft:'1rem',margin:0,display:'flex',flexDirection:'column',gap:4 }}>
                {ex.warnings.map((w,i) => <li key={i} style={{ fontSize:'0.78rem',color:'#f87171',lineHeight:1.5 }}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Category */}
          <div style={{ background:'#141414',borderRadius:10,padding:'1rem' }}>
            <p style={{ fontSize:'0.75rem',color:'#888',margin:'0 0 8px' }}>Category</p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,alignItems:'center' }}>
              {(Array.isArray(ex.muscleGroup) ? ex.muscleGroup : [ex.muscleGroup]).filter(Boolean).map(g => (
                <span key={g} style={{ padding:'4px 12px',background:'#c0392b',borderRadius:20,fontSize:'0.75rem',fontWeight:600,color:'#fff' }}>
                  {g}
                </span>
              ))}
              <span style={{ padding:'4px 12px',background:'#252525',borderRadius:20,fontSize:'0.75rem',color:'#888' }}>
                {ex.difficulty}
              </span>
              {ex.verified && (
                <span style={{ padding:'4px 12px',background:'#1a4731',borderRadius:20,fontSize:'0.75rem',color:'#48bb78',display:'flex',alignItems:'center',gap:4 }}>
                  <CheckCircle2 size={12}/> verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit button */}
        <button onClick={onEdit} style={{ marginTop:'1rem',width:'100%',padding:'10px',border:'1px solid #333',borderRadius:8,background:'none',color:'#aaa',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
          <Pencil size={14}/> Edit exercise
        </button>
      </div>
    </div>
  );
}

/* ─── Edit / Add form ───────────────────────────────────── */
function ExerciseForm({ initial, onBack, onSaved }) {
  const isNew = !initial?._id;
  const [form, setForm] = useState({
    name:           initial?.name || '',
    nameEn:         initial?.nameEn || '',
    muscleGroup:    initial?.muscleGroup || 'Arm',
    difficulty:     initial?.difficulty || 'beginner',
    description:    initial?.description || '',
    steps:          initial?.steps?.join('\n') || '',
    warnings:       initial?.warnings?.join('\n') || '',
    youtubeVideoId: initial?.youtubeVideoId || '',
    imageUrl:       initial?.imageUrl || '',
    verified:       initial?.verified || false,
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');
  const [catChips,    setCatChips]    = useState(
    Array.isArray(initial?.muscleGroup) ? initial.muscleGroup
    : initial?.muscleGroup ? [initial.muscleGroup]
    : []
  );
  const [showCatPick, setShowCatPick] = useState(false);
  const catRef = useRef(null);

  useEffect(() => {
    const close = e => { if (catRef.current && !catRef.current.contains(e.target)) setShowCatPick(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  const addCat    = (c) => { if (!catChips.includes(c)) setCatChips(p => [...p, c]); setShowCatPick(false); };
  const removeCat = (c) => setCatChips(p => p.filter(x => x !== c));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    const body = {
      ...form,
      muscleGroup: catChips,
      steps:    form.steps.split('\n').map(s => s.trim()).filter(Boolean),
      warnings: form.warnings.split('\n').map(s => s.trim()).filter(Boolean),
    };
    const url    = isNew ? `${API}/admin/exercises` : `${API}/admin/exercises/${initial._id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk()}`}, body:JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.message); setSaving(false); return; }
    setSaving(false);
    onSaved(data);
  };

  const ytId = form.youtubeVideoId;

  return (
    <div style={{ maxWidth:900,margin:'0 auto' }}>
      <div className="adm-section-card" style={{ padding:'1.5rem',position:'relative' }}>
        <button onClick={onBack} style={{ position:'absolute',top:'1.2rem',left:'1.2rem',background:'#252525',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',gap:4,fontSize:'0.8rem' }}>
          <ChevronLeft size={16}/>
        </button>

        <h2 style={{ textAlign:'center',margin:'0 0 1.5rem',fontSize:'1.2rem',fontWeight:700 }}>
          {isNew ? 'Add new exercise' : 'Edit exercise'}
        </h2>

        {/* Video preview + controls */}
        <div style={{ display:'flex',gap:12,justifyContent:'center',marginBottom:'1.5rem',alignItems:'center' }}>
          <div style={{ position:'relative',width:260,background:'#111',borderRadius:12,overflow:'hidden',aspectRatio:'16/9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            {ytId ? (
              <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                style={{ position:'absolute',inset:0,width:'100%',height:'100%' }}
                frameBorder="0" allowFullScreen title="preview" />
            ) : (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,color:'#444' }}>
                <Play size={32}/><span style={{fontSize:'0.75rem'}}>ดูวีดีโอสาธิต</span>
              </div>
            )}
            {ytId && (
              <button onClick={() => setForm(f=>({...f,youtubeVideoId:''}))}
                style={{ position:'absolute',bottom:6,right:6,background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',padding:4,cursor:'pointer',color:'#e53e3e',display:'flex' }}>
                <RotateCcw size={14}/>
              </button>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <FInput label="YouTube Video ID" value={form.youtubeVideoId} onChange={set('youtubeVideoId')} placeholder="e.g. rT7DgCr-3pg" />
          <FInput label="ชื่อท่า *" value={form.name} onChange={set('name')} placeholder="ชื่อท่า" />
          <FInput label="ชื่อภาษาอังกฤษ" value={form.nameEn} onChange={set('nameEn')} placeholder="Exercise name (EN)" />
          <FInput label="Image URL" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />

          <FTextarea label="คำอธิบาย" value={form.description} onChange={set('description')}
            placeholder="คำอธิบายโดยย่อของท่าออกกำลังกาย..." rows={2} />

          <FTextarea label="วิธีเล่น *" value={form.steps} onChange={set('steps')}
            placeholder="พิมพ์ทีละขั้นตอน แต่ละบรรทัด = 1 ขั้นตอน" rows={4} />

          <FTextarea label="คำเตือนเพื่อป้องกันการบาดเจ็บ *" value={form.warnings} onChange={set('warnings')}
            placeholder="แต่ละบรรทัด = 1 คำเตือน" rows={3}
            style={{ background:'#1f0a0a',borderColor:'#3d0a0a',color:'#f87171' }} />

          {/* Category chips */}
          <div>
            <label style={{ fontSize:'0.7rem',color:'#666',display:'block',marginBottom:6 }}>ประเภท</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,alignItems:'center' }}>
              {catChips.map(c => (
                <div key={c} style={{ display:'flex',alignItems:'center',gap:2 }}>
                  <span style={{ padding:'5px 14px',background:'#c0392b',borderRadius:20,color:'#fff',fontSize:'0.78rem',fontWeight:600 }}>
                    {c}
                  </span>
                  <button onClick={() => removeCat(c)}
                    style={{ background:'none',border:'none',color:'#666',cursor:'pointer',padding:'2px',display:'flex' }}>
                    <XCircle size={15}/>
                  </button>
                </div>
              ))}

              {/* Category picker */}
              <div ref={catRef} style={{ position:'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowCatPick(v => !v)}
                  style={{ width:28,height:28,borderRadius:'50%',background:'#252525',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#888' }}>
                  <Plus size={14}/>
                </button>
                {showCatPick && (
                  <div style={{ position:'absolute',top:32,left:0,zIndex:99,background:'#1e1e1e',border:'1px solid #2a2a2a',borderRadius:8,padding:4,minWidth:130,boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                    {CATS.filter(c => !catChips.includes(c)).map(c => (
                      <button key={c} onClick={() => addCat(c)}
                        style={{ display:'block',width:'100%',padding:'7px 12px',background:'none',border:'none',color:'#ccc',fontSize:'0.82rem',cursor:'pointer',textAlign:'left',borderRadius:6 }}
                        onMouseEnter={e=>e.target.style.background='#252525'}
                        onMouseLeave={e=>e.target.style.background='none'}>
                        {c}
                      </button>
                    ))}
                    {CATS.filter(c => !catChips.includes(c)).length === 0 && (
                      <p style={{ color:'#555',fontSize:'0.75rem',padding:'8px 12px',margin:0 }}>All added</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ fontSize:'0.7rem',color:'#666',display:'block',marginBottom:6 }}>ระดับความยาก</label>
            <div style={{ display:'flex',gap:8 }}>
              {['beginner','intermediate','advanced'].map(d => (
                <button key={d} onClick={() => setForm(f=>({...f,difficulty:d}))}
                  style={{ flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,
                    background: form.difficulty===d ? '#c0392b' : '#252525',
                    color: form.difficulty===d ? '#fff' : '#666' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Verified toggle */}
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button onClick={toggle('verified')} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',padding:0 }}>
              <div style={{ width:36,height:20,borderRadius:10,background:form.verified?'#276749':'#333',position:'relative',transition:'background 0.2s' }}>
                <div style={{ position:'absolute',top:2,left:form.verified?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s' }}/>
              </div>
              <span style={{ fontSize:'0.8rem',color:'#aaa' }}>Verified exercise</span>
            </button>
          </div>

          {error && <p style={{ color:'#e53e3e',fontSize:'0.8rem' }}>{error}</p>}

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4 }}>
            <button onClick={onBack} style={{ padding:'10px',border:'1px solid #333',borderRadius:8,background:'none',color:'#aaa',cursor:'pointer',fontWeight:600 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding:'10px',border:'none',borderRadius:8,background:'#c0392b',color:'#fff',cursor:'pointer',fontWeight:700 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MUSCLE_OPTS = ['Arm','Chest','Leg','Back','Shoulder'].map(v=>({value:v,label:v}));
const STATUS_OPTS = [{ value:'published', label:'Published' }, { value:'draft', label:'Draft' }];
const SORT_OPTS   = [
  { value:'newest', label:'Newest first' },
  { value:'oldest', label:'Oldest first' },
  { value:'az',     label:'Name A → Z' },
  { value:'za',     label:'Name Z → A' },
];

/* ─── Main page ─────────────────────────────────────────── */
export default function Content() {
  const [exercises, setExercises] = useState([]);
  const [total,  setTotal]  = useState(0);
  const [pages,  setPages]  = useState(1);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('');
  const [status, setStatus] = useState('');
  const [sort,   setSort]   = useState('newest');
  const [view,   setView]   = useState(null);
  const [delId,  setDelId]  = useState(null);

  const fetchExercises = useCallback((p, q, m, st, so) => {
    const params = new URLSearchParams({ page: p, limit: 10, sort: so });
    if (q)  params.set('search', q);
    if (m)  params.set('muscleGroup', m);
    if (st) params.set('status', st);
    fetch(`${API}/admin/exercises?${params}`, { headers:{ Authorization:`Bearer ${tk()}` } })
      .then(r => r.json())
      .then(d => { setExercises(d.exercises||[]); setTotal(d.total||0); setPages(d.pages||1); })
      .catch(() => {});
  }, []); // no deps — all args passed explicitly

  useEffect(() => { fetchExercises(1, search, muscle, status, sort); }, [search, muscle, status, sort, fetchExercises]);

  const load  = (p = page) => fetchExercises(p, search, muscle, status, sort);
  const goPage = p => { if (p<1||p>pages) return; setPage(p); fetchExercises(p,search,muscle,status,sort); };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/admin/exercises/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${tk()}` } });
      if (!res.ok) throw new Error('ลบไม่สำเร็จ');
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setDelId(null);
      fetchExercises(page, search, muscle, status, sort);
    }
  };

  const pageNums = () => {
    if (pages <= 7) return Array.from({length:pages},(_,i)=>i+1);
    if (page <= 4) return [1,2,3,'...',pages];
    if (page >= pages-3) return [1,'...',pages-2,pages-1,pages];
    return [1,'...',page-1,page,page+1,'...',pages];
  };

  // ── detail/edit/add view ──
  if (view) {
    if (view.mode === 'view') return (
      <>
        <h1 className="adm-page-title">Content Management</h1>
        <p className="adm-page-sub">overview of the website "YOKLEK"</p>
        <ViewPanel ex={view.ex} onBack={() => setView(null)} onEdit={() => setView({mode:'edit',ex:view.ex})} />
      </>
    );
    if (view.mode === 'edit' || view.mode === 'add') return (
      <>
        <h1 className="adm-page-title">Content Management</h1>
        <p className="adm-page-sub">overview of the website "YOKLEK"</p>
        <ExerciseForm
          initial={view.mode==='add' ? null : view.ex}
          onBack={() => view.mode==='add' ? setView(null) : setView({mode:'view',ex:view.ex})}
          onSaved={(updated) => {
            fetchExercises(page, search, muscle, status, sort);
            setView({mode:'view',ex:updated});
          }}
        />
      </>
    );
  }

  // ── list view ──
  const diffColor = { beginner:'#48bb78', intermediate:'#ed8936', advanced:'#e53e3e' };

  return (
    <>
      <h1 className="adm-page-title">Content Management</h1>
      <p className="adm-page-sub">overview of the website "YOKLEK"</p>

      {/* Toolbar */}
      <div style={{ display:'flex',gap:10,marginBottom:16,alignItems:'center' }}>
        <div style={{ position:'relative',flex:1,maxWidth:320 }}>
          <Search size={14} color="#555" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)' }}/>
          <input placeholder="search by name" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            style={{ width:'100%',paddingLeft:32,padding:'9px 12px 9px 32px',background:'#1a1a1a',border:'1px solid #252525',borderRadius:8,color:'#fff',fontSize:'0.82rem',outline:'none',boxSizing:'border-box' }}/>
        </div>
        <Dropdown
          label="Category"
          icon={<SlidersHorizontal size={13}/>}
          options={MUSCLE_OPTS}
          value={muscle}
          onChange={v => { setMuscle(v === muscle ? '' : v); setPage(1); }}
          minWidth={150}
        />
        <Dropdown
          label="Status"
          options={STATUS_OPTS}
          value={status}
          onChange={v => { setStatus(v === status ? '' : v); setPage(1); }}
          minWidth={140}
        />
        <Dropdown
          label="Newest first"
          options={SORT_OPTS}
          value={sort}
          onChange={v => { setSort(v); setPage(1); }}
          minWidth={160}
        />
        <button onClick={() => setView({mode:'add',ex:null})}
          style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'none',border:'1.5px solid #c0392b',borderRadius:20,color:'#c0392b',fontSize:'0.82rem',fontWeight:600,cursor:'pointer' }}>
          <Plus size={15}/> Add new exercise
        </button>
      </div>

      {/* Table */}
      <div className="adm-section-card" style={{ padding:0,overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.82rem' }}>
          <thead>
            <tr style={{ background:'#1e1e1e',borderBottom:'1px solid #252525' }}>
              <th style={{ textAlign:'left',padding:'12px 16px',fontWeight:500,color:'#888' }}>Exercise Name</th>
              <th style={{ textAlign:'center',padding:'12px 8px',fontWeight:500,color:'#888' }}>Category</th>
              <th style={{ textAlign:'center',padding:'12px 8px',fontWeight:500,color:'#888' }}>Verified Users</th>
              <th style={{ textAlign:'center',padding:'12px 8px',fontWeight:500,color:'#888' }}>Status</th>
              <th style={{ width:80 }}/>
            </tr>
          </thead>
          <tbody>
            {exercises.map(ex => (
              <tr key={ex._id} style={{ borderBottom:'1px solid #1a1a1a',transition:'background 0.1s',cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#1e1e1e'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 16px' }} onClick={() => setView({mode:'view',ex})}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <img src={ex.imageUrl} alt="" style={{ width:36,height:36,borderRadius:6,objectFit:'cover',background:'#333',flexShrink:0 }}
                      onError={e=>{e.target.style.display='none'}} />
                    <div>
                      <div style={{ color:'#fff',fontWeight:500 }}>{ex.name}</div>
                      {ex.nameEn && <div style={{ fontSize:'0.7rem',color:'#555' }}>{ex.nameEn}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign:'center',padding:'12px 8px' }} onClick={() => setView({mode:'view',ex})}>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center' }}>
                    {(Array.isArray(ex.muscleGroup) ? ex.muscleGroup : [ex.muscleGroup]).filter(Boolean).map(g => (
                      <span key={g} style={{ padding:'2px 8px',background:'#2a1515',border:'1px solid #5a1e1e',borderRadius:20,fontSize:'0.68rem',color:'#f87171' }}>{g}</span>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign:'center',color:'#aaa',padding:'12px 8px' }} onClick={() => setView({mode:'view',ex})}>
                  {ex.verifiedUsers}
                </td>
                <td style={{ textAlign:'center',padding:'12px 8px' }}>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Optimistic update — show new state immediately
                      setExercises(prev => prev.map(e =>
                        e._id === ex._id ? { ...e, verified: !e.verified } : e
                      ));
                      const res = await fetch(`${API}/admin/exercises/${ex._id}/toggle-verified`, {
                        method: 'PUT', headers: { Authorization: `Bearer ${tk()}` },
                      });
                      if (!res.ok) {
                        // Revert if request failed
                        setExercises(prev => prev.map(e =>
                          e._id === ex._id ? { ...e, verified: ex.verified } : e
                        ));
                      } else {
                        // Clear status filter so user can see the updated exercise in the list
                        setStatus('');
                        setTimeout(() => fetchExercises(page, search, muscle, '', sort), 600);
                      }
                    }}
                    title="คลิกเพื่อเปลี่ยนสถานะ"
                    style={{ padding:'3px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:600,
                      border: ex.verified ? '1px solid #48bb78' : '1px solid #555',
                      cursor:'pointer',
                      background: ex.verified ? '#1a4731' : '#2a2a2a',
                      color:      ex.verified ? '#48bb78' : '#aaa',
                      display:'flex', alignItems:'center', gap:4,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {ex.verified ? '● Published' : '○ Draft'}
                  </button>
                </td>
                <td style={{ padding:'12px 8px',textAlign:'center' }}>
                  <div style={{ display:'flex',justifyContent:'center',gap:6 }}>
                    <button onClick={() => setView({mode:'edit',ex})}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'#666',padding:4 }}>
                      <Pencil size={15}/>
                    </button>
                    <button onClick={() => setDelId(ex._id)}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'#666',padding:4 }}>
                      <XCircle size={15}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exercises.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign:'center',padding:'2rem',color:'#444' }}>No exercises found</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:4,padding:'14px 16px',borderTop:'1px solid #1a1a1a' }}>
          <PgBtn onClick={() => goPage(page-1)} disabled={page===1}><ChevronLeft size={14}/></PgBtn>
          {pageNums().map((n,i) => (
            n==='...'
              ? <span key={`e${i}`} style={{ padding:'4px 6px',color:'#555',fontSize:'0.8rem' }}>...</span>
              : <PgBtn key={n} active={n===page} onClick={() => goPage(n)}>{n}</PgBtn>
          ))}
          <PgBtn onClick={() => goPage(page+1)} disabled={page===pages}><ChevronRight size={14}/></PgBtn>
        </div>
      </div>

      {/* Delete confirm overlay */}
      {delId && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999 }}>
          <div style={{ background:'#1e1e1e',borderRadius:12,padding:'2rem',width:340,textAlign:'center' }}>
            <p style={{ color:'#fff',fontWeight:600,marginBottom:8 }}>Delete this exercise?</p>
            <p style={{ color:'#888',fontSize:'0.82rem',marginBottom:'1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={() => setDelId(null)} style={{ flex:1,padding:'10px',border:'1px solid #333',borderRadius:8,background:'none',color:'#aaa',cursor:'pointer',fontWeight:600 }}>Cancel</button>
              <button onClick={() => handleDelete(delId)} style={{ flex:1,padding:'10px',border:'none',borderRadius:8,background:'#c0392b',color:'#fff',cursor:'pointer',fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Small form components ─────────────────────────────── */
function FInput({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      <label style={{ fontSize:'0.7rem',color:'#666',display:'block',marginBottom:4 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width:'100%',padding:'9px 12px',background:'#141414',border:'1px solid #252525',borderRadius:8,color:'#fff',fontSize:'0.82rem',outline:'none',boxSizing:'border-box' }}/>
    </div>
  );
}
function FTextarea({ label, value, onChange, placeholder, rows=3, style:extra={} }) {
  return (
    <div>
      <label style={{ fontSize:'0.7rem',color:'#666',display:'block',marginBottom:4 }}>{label}</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ width:'100%',padding:'9px 12px',background:'#141414',border:'1px solid #252525',borderRadius:8,color:'#fff',fontSize:'0.82rem',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit',...extra }}/>
    </div>
  );
}
