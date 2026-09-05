import React from 'react';
import { useUpdateApplicationStatus } from '../hooks/useApplicationStatus';

const ALLOWED_NEXT = {
  applied: ['screening', 'rejected', 'withdrawn'],
  screening: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  rejected: [],
  hired: [],
  withdrawn: []
};

export default function ApplicationStatus({ application, currentUser }) {
  const mutation = useUpdateApplicationStatus();

  const canChange = currentUser && currentUser.role === 'employer' && currentUser.id === (application.employer && application.employer._id ? application.employer._id : application.employer);
  const isCandidate = currentUser && currentUser.id === (application.candidate && application.candidate._id ? application.candidate._id : application.candidate);

  const nextOptions = ALLOWED_NEXT[application.status] || [];

  const handleChange = (newStatus) => {
    const note = window.prompt('Optional note for this status change (internal):', '');
    mutation.mutate({ applicationId: application._id, newStatus, note });
  };

  return (
    <div className="application-status">
      <div><strong>Status:</strong> {application.status}</div>
      <div className="history">
        {application.history && application.history.slice().reverse().map((h, idx) => (
          <div key={idx} className="history-row">
            <small>{new Date(h.at).toLocaleString()} — {h.status} — {h.note || ''}</small>
          </div>
        ))}
      </div>

      {canChange && nextOptions.length > 0 && (
        <div className="actions">
          <label>Change status:</label>
          {nextOptions.map(s => (
            <button key={s} onClick={() => handleChange(s)} disabled={mutation.isLoading}>
              {s}
            </button>
          ))}
        </div>
      )}

      {isCandidate && application.status !== 'withdrawn' && (
        <div className="candidate-actions">
          <button onClick={() => handleChange('withdrawn')} disabled={mutation.isLoading}>Withdraw application</button>
        </div>
      )}
    </div>
  );
}
