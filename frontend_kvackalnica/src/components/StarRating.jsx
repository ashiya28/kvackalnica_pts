import React, { useState, useEffect } from 'react';

export default function StarRating({ projectId, initial = 3, onSaved, getAuthHeaders }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => setValue(initial), [initial]);

  async function saveRating(v) {
    if (saving) return;
    setError(null);
    const prev = value;
    setValue(v); // optimistic UI
    setSaving(true);

    const headers = getAuthHeaders ? getAuthHeaders() : { 'Content-Type': 'application/json' };
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/difficulty`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ difficulty_rating: v })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      const data = await res.json();
      setValue(v);
      if (onSaved) onSaved(data.project || data);
    } catch (e) {
      console.error(e);
      setValue(prev);
      setError(e.message || 'Napaka pri shranjevanju');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="star-rating inline-flex items-center" role="radiogroup" aria-label="Ocena težavnosti">
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => saveRating(i)}
            disabled={saving}
            aria-checked={i === value}
            aria-label={`Rate ${i}`}
            className={`px-1 text-3xl focus:outline-none ${i <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            {i <= value ? '★' : '☆'}
          </button>
        ))}
      </div>

      <div className="mt-2 text-center text-sm text-gray-700">
        {saving ? 'Shranjujem...' : `Ocena: ${value}`}
      </div>

      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
}