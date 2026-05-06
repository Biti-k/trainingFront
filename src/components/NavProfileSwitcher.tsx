import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { api } from '../services/api';

export default function NavProfileSwitcher() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.profiles.list();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    setActiveProfile(profile);
    localStorage.setItem('activeProfileId', profile.id.toString());
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    setShowDropdown(false);
    window.location.reload(); // Reload to update the app with new profile
  };

  const handleSwitchProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('activeProfileId');
    localStorage.removeItem('activeProfile');
    window.location.href = '/'; // Go to home which will show profile selector
  };

  if (!activeProfile) return null;

  return (
    <div className="nav-profile" style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="nav-profile-btn"
        style={{
          background: 'none',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.375rem 0.75rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        <span>{activeProfile.name}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div
          className="nav-profile-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem',
            minWidth: '200px',
            zIndex: 1000,
            marginTop: '0.25rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Switch Profile
          </div>
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem',
                border: 'none',
                background: profile.id === activeProfile.id ? 'var(--green-900)' : 'none',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {profile.name}
            </button>
          ))}
          <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <button
            onClick={handleSwitchProfile}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.5rem',
              border: 'none',
              background: 'none',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Manage Profiles
          </button>
        </div>
      )}
    </div>
  );
}