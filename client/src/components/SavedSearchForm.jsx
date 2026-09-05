import React, { useState } from 'react';
import { useCreateSavedSearch } from '../hooks/useSavedSearches';

export default function SavedSearchForm() {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [frequency, setFrequency] = useState('daily');

  const create = useCreateSavedSearch();

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      name,
      keywords: keywords.split(',').map(s => s.trim()).filter(Boolean),
      location,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      frequency
    });
  };

  return (
    <form onSubmit={submit} className="saved-search-form">
      <div>
        <label>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label>Keywords (comma separated)</label>
        <input value={keywords} onChange={e => setKeywords(e.target.value)} />
      </div>
      <div>
        <label>Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div>
        <label>Skills (comma separated)</label>
        <input value={skills} onChange={e => setSkills(e.target.value)} />
      </div>
      <div>
        <label>Frequency</label>
        <select value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="immediate">Immediate</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <button type="submit" disabled={create.isLoading}>Save</button>
    </form>
  );
}
