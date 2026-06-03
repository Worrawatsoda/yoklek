import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { API } from '../lib/api';

const tk  = () => localStorage.getItem('token');

const todayISO = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

function Record() {
  const [exercises,     setExercises]     = useState([{ id: 1, exerciseId: '', exerciseName: '', sets: [] }]);
  const [exerciseOpts,  setExerciseOpts]  = useState([]);
  const [date,          setDate]          = useState(todayISO());
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState('');

  // Fetch exercise list from DB (verified only)
  useEffect(() => {
    fetch(`${API}/exercises?verified=true`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExerciseOpts(data.map(ex => ({
            value: ex._id,
            label: ex.name,
            nameEn: ex.nameEn,
          })));
        }
      })
      .catch(() => {});
  }, []);

  /* ── handlers ─────────────────────────────────────────── */
  const handleAddSet = (exId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const nextId = ex.sets.length > 0 ? Math.max(...ex.sets.map(s => s.id)) + 1 : 1;
      return { ...ex, sets: [...ex.sets, { id: nextId, reps: '', weight: '' }] };
    }));
  };

  const handleRemoveSet = (exId, setId) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex
    ));
  };

  const handleSetChange = (exId, setId, field, value) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
    }));
  };

  const handleExerciseSelect = (exId, selectedId) => {
    const opt = exerciseOpts.find(o => o.value === selectedId);
    let updated = exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const wasEmpty = !ex.exerciseId;
      return {
        ...ex,
        exerciseId:   selectedId,
        exerciseName: opt?.label || '',
        sets: wasEmpty
          ? [{ id: 1, reps: '', weight: '' }, { id: 2, reps: '', weight: '' }, { id: 3, reps: '', weight: '' }]
          : ex.sets,
      };
    });

    // Auto-append a blank exercise slot if last one is now filled
    const lastEx = exercises.find(e => e.id === exId);
    if (!lastEx.exerciseId && selectedId) {
      const isLast = exercises[exercises.length - 1].id === exId;
      if (isLast) {
        const nextId = Math.max(...updated.map(e => e.id)) + 1;
        updated.push({ id: nextId, exerciseId: '', exerciseName: '', sets: [] });
      }
    }
    setExercises(updated);
  };

  const handleGoalChange = (exId, value) => {
    setExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, goal: value } : ex));
  };

  const handleRemoveExercise = (exId) => {
    let updated = exercises.filter(ex => ex.id !== exId);
    // Always keep at least one blank slot at the end
    if (updated.length === 0 || updated[updated.length - 1].exerciseId !== '') {
      const nextId = updated.length > 0 ? Math.max(...updated.map(e => e.id)) + 1 : 1;
      updated.push({ id: nextId, exerciseId: '', exerciseName: '', sets: [] });
    }
    setExercises(updated);
  };

  /* ── save ─────────────────────────────────────────────── */
  const handleSave = async () => {
    setError('');
    const filled = exercises.filter(ex => ex.exerciseId && ex.sets.length > 0);
    if (filled.length === 0) {
      setError('เพิ่มอย่างน้อย 1 ท่าพร้อม set ก่อน save');
      return;
    }
    const hasValidSet = filled.some(ex => ex.sets.some(s => Number(s.reps) > 0 || Number(s.weight) > 0));
    if (!hasValidSet) {
      setError('กรุณากรอก reps หรือ weight อย่างน้อย 1 set');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/workoutlogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
        body: JSON.stringify({
          date,
          exercises: filled.map(ex => ({
            exerciseId:   ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets:         ex.sets.map(s => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
          })),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message || 'Save ไม่สำเร็จ');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="record-page" style={{ paddingBottom: '3rem' }}>

      {/* Date picker */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={e => setDate(e.target.value)}
          style={{
            background: '#1e1e1e', border: '1px solid #333', borderRadius: 8,
            color: '#fff', padding: '0.5rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer',
          }}
        />
      </div>

      {exercises.map((exercise) => {
        return (
          <div key={exercise.id} className="record-card">
            <div className="record-card-header">
              <span className="record-exercise-label">Exercise</span>
              {exercises.length > 1 && exercise.exerciseId && (
                <button
                  onClick={() => handleRemoveExercise(exercise.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <Select
              options={exerciseOpts}
              value={exercise.exerciseId}
              onChange={e => handleExerciseSelect(exercise.id, e.target.value)}
              defaultLabel="Select Exercise"
              style={{
                backgroundColor: '#424242',
                color: exercise.exerciseId ? '#fff' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '0.8rem',
              }}
            />

            {exercise.exerciseId && (
              <>
                <div className="record-table">
                  <div className="record-table-header" style={{ gridTemplateColumns: '1fr 2fr 2fr 30px' }}>
                    <div>Set</div>
                    <div>Reps</div>
                    <div>Weight</div>
                    <div />
                  </div>

                  {exercise.sets.map((set, i) => (
                    <div key={set.id} className="record-table-row" style={{ gridTemplateColumns: '1fr 2fr 2fr 30px' }}>
                      <div className="set-number">{i + 1}</div>
                      <div className="input-cell">
                        <input
                          type="number" min="0" className="record-input"
                          value={set.reps}
                          onChange={e => handleSetChange(exercise.id, set.id, 'reps', e.target.value)}
                        />
                      </div>
                      <div className="input-cell weight-cell">
                        <input
                          type="number" min="0" className="record-input"
                          value={set.weight}
                          onChange={e => handleSetChange(exercise.id, set.id, 'weight', e.target.value)}
                        />
                        <span className="unit-label">kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleRemoveSet(exercise.id, set.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="record-footer">
                  <button className="add-set-btn" onClick={() => handleAddSet(exercise.id)}>
                    + Add Set
                  </button>
                </div>

              </>
            )}
          </div>
        );
      })}

      {/* Error */}
      {error && (
        <p style={{ color: '#e53e3e', fontSize: '0.82rem', textAlign: 'center', margin: '0.5rem 0' }}>
          {error}
        </p>
      )}

      {/* Save button */}
      <div style={{ marginTop: '3rem' }}>
        <Button
          variant="primary"
          style={{ padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saved
            ? <><CheckCircle2 size={18} /> Saved!</>
            : saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

    </div>
  );
}

export default Record;
