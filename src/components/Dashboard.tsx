import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

export function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [bodyweight, setBodyweight] = useState<any[]>([]);
  const [progression, setProgression] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.summary(),
      api.analytics.bodyweight(90),
      api.analytics.progression(),
    ]).then(([s, bw, p]) => {
      setSummary(s);
      setBodyweight(bw);
      setProgression(p);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading analytics...</p>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{summary?.total_workouts || 0}</div>
          <div className="stat-label">Total Workouts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(summary?.total_volume || 0).toLocaleString()} kg</div>
          <div className="stat-label">Total Volume</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.exercises_count || 0}</div>
          <div className="stat-label">Exercises Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.avg_bodyweight ? `${summary.avg_bodyweight} kg` : '—'}</div>
          <div className="stat-label">Avg Bodyweight</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h2>Bodyweight Trend</h2>
          {bodyweight.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bodyweight}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="bodyweight" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted">No bodyweight data</p>
          )}
        </div>

        <div className="card">
          <h2>Progression</h2>
          {progression.length > 0 ? (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Max</th>
                    <th>Est. 1RM</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {progression.map((p) => (
                    <tr key={p.exercise_name}>
                      <td>{p.exercise_name}</td>
                      <td>{p.max_weight} kg ({p.max_reps} reps)</td>
                      <td>{p.estimated_1rm ? `${p.estimated_1rm} kg` : '—'}</td>
                      <td>{p.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">Log workouts to see progression</p>
          )}
        </div>
      </div>
    </div>
  );
}
