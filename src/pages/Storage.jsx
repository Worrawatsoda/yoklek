import { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { API } from '../lib/api';
const tk  = () => localStorage.getItem('token');

const categories = ['All', 'Arm', 'Chest', 'Leg', 'Back', 'Shoulder'];

const difficultyColor = { beginner: '#48bb78', intermediate: '#ed8936', advanced: '#e53e3e' };

function Storage() {
  const [exercises,    setExercises]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [selected,     setSelected]     = useState(null);
  const [myBadges,     setMyBadges]     = useState(new Set()); // Set of exerciseId strings

  // Fetch user's earned badges once
  useEffect(() => {
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(r => r.json())
      .then(user => {
        if (Array.isArray(user.badges)) {
          setMyBadges(new Set(user.badges.map(b => b.exerciseId?.toString())));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('verified', 'true');
    if (searchQuery) params.set('search', searchQuery);
    if (activeCategory !== 'All') params.set('muscleGroup', activeCategory);

    setLoading(true);
    fetch(`${API}/exercises?${params}`)
      .then((r) => r.json())
      .then((data) => { setExercises(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [searchQuery, activeCategory]);

  return (
    <div className="storage-page" style={{ paddingBottom: '2rem' }}>
      {/* Search */}
      <div className="search-container">
        <Search size={20} className="search-icon" />
        <input
          className="search-input"
          placeholder="What posture do you want to do?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="category-scroll-container">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Verified Filter */}
      <div className="verified-filter" onClick={() => setVerifiedOnly(!verifiedOnly)}>
        <div className={`custom-checkbox ${verifiedOnly ? 'checked' : ''}`}>
          {verifiedOnly && <CheckCircle2 size={14} color="#fff" />}
        </div>
        <span>verified only</span>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Loading...</p>
      ) : exercises.filter(ex => !verifiedOnly || myBadges.has(ex._id?.toString())).length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
          {verifiedOnly ? 'ยังไม่มีท่าที่คุณ verify แล้ว' : 'No exercises found'}
        </p>
      ) : (
        <div className="exercise-list">
          {exercises.filter(ex => !verifiedOnly || myBadges.has(ex._id?.toString())).map((ex) => (
            <div key={ex._id} className="exercise-card" onClick={() => setSelected(ex)}>
              <img src={ex.imageUrl} alt={ex.name} className="exercise-image" />
              <div className="exercise-info">
                <h3 className="exercise-title">{ex.name}</h3>
                <p className="exercise-subtitle">{ex.nameEn}</p>
                <div className="exercise-tags">
                  {(Array.isArray(ex.muscleGroup) ? ex.muscleGroup : [ex.muscleGroup]).filter(Boolean).map(g => (
                    <span key={g} className="tag category-tag">{g}</span>
                  ))}
                  <span style={{ fontSize: '0.65rem', color: difficultyColor[ex.difficulty], fontWeight: 600 }}>
                    {ex.difficulty}
                  </span>
                  {myBadges.has(ex._id?.toString()) && (
                    <span className="tag verified-tag">verified <CheckCircle2 size={12} /></span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <ExerciseModal exercise={selected} onClose={() => setSelected(null)} isVerified={myBadges.has(selected._id?.toString())} />
      )}
    </div>
  );
}

function ExerciseModal({ exercise, onClose, isVerified }) {
  return (
    <div className="full-screen-modal">
      <div className="modal-header">
        <div style={{ width: '2.5rem', flexShrink: 0 }} />
        <h2 className="modal-title">{exercise.name}</h2>
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
      </div>

      <div className="modal-content-scroll">
        {/* YouTube Video */}
        {exercise.youtubeVideoId ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
            <iframe
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              src={`https://www.youtube.com/embed/${exercise.youtubeVideoId}?rel=0&modestbranding=1`}
              title={exercise.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <img src={exercise.imageUrl} alt={exercise.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '200px' }} />
        )}

        {/* Tags */}
        <div className="modal-tags" style={{ marginBottom: '1rem' }}>
          {(Array.isArray(exercise.muscleGroup) ? exercise.muscleGroup : [exercise.muscleGroup]).filter(Boolean).map(g => (
            <span key={g} className="modal-category-tag">{g}</span>
          ))}
          <span style={{ fontSize: '0.7rem', color: difficultyColor[exercise.difficulty], fontWeight: 700, textTransform: 'capitalize' }}>
            {exercise.difficulty}
          </span>
          {isVerified && (
            <span className="modal-verified-tag">verified <CheckCircle2 size={14} /></span>
          )}
        </div>

        {/* Description */}
        {exercise.description && (
          <div className="instructions-section" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{exercise.description}</p>
          </div>
        )}

        {/* Steps */}
        {exercise.steps && exercise.steps.length > 0 && (
          <div className="instructions-section">
            <h3>วิธีเล่น</h3>
            <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exercise.steps.map((step, i) => (
                <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Warnings */}
        {exercise.warnings && exercise.warnings.length > 0 && (
          <div className="warnings-section">
            <h3 className="warnings-title">
              <AlertTriangle size={16} />
              คำเตือนเพื่อป้องกันการบาดเจ็บ
            </h3>
            <ul className="warnings-list">
              {exercise.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Storage;
