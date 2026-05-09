import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { api } from '../services/api';

interface ProfileSelectorProps {
  onProfileSelect?: (profile: Profile) => void;
  selectedProfile?: Profile | null;
}

export default function ProfileSelector({ onProfileSelect, selectedProfile }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProfileId, setActiveProfileId] = useState<number | null>(selectedProfile?.id ?? null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile?.id) {
      setActiveProfileId(selectedProfile.id);
      return;
    }

    const storedProfileId = window.localStorage.getItem('activeProfileId');
    if (storedProfileId) {
      setActiveProfileId(parseInt(storedProfileId, 10));
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    try {
      const data = await api.profiles.list();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setError('Unable to load profiles. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const saveActiveProfile = (profile: Profile) => {
    window.localStorage.setItem('activeProfileId', profile.id.toString());
    window.localStorage.setItem('activeProfile', JSON.stringify(profile));
    setActiveProfileId(profile.id);
    onProfileSelect?.(profile);
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Profile name cannot be empty.');
      return;
    }

    try {
      setError('');
      const profile = await api.profiles.create({ name: newProfileName.trim() });
      setProfiles((current) => [...current, profile]);
      setNewProfileName('');
      setIsCreating(false);
      saveActiveProfile(profile);
    } catch (error: any) {
      console.error('Failed to create profile:', error);
      setError(error?.message || 'Failed to create profile.');
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm('Delete this profile? This will remove all exercises and workouts for that profile.')) return;

    try {
      await api.profiles.delete(profileId);
      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      if (activeProfileId === profileId) {
        window.localStorage.removeItem('activeProfileId');
        window.localStorage.removeItem('activeProfile');
        setActiveProfileId(null);
      }
    } catch (error: any) {
      console.error('Failed to delete profile:', error);
      setError(error?.message || 'Unable to delete profile.');
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    saveActiveProfile(profile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-950 to-emerald-900">
        <div className="text-lg text-emerald-100">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_35%)] py-12">
      <div className="container mx-auto px-4">
        <div className="glass p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-emerald-100">Select Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-200/80">
                Choose a profile to scope your exercises, workouts, and analytics. Add a new profile or delete one any time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating((prev) => !prev);
                setError('');
              }}
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-900/40 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-green-sm transition hover:border-emerald-200 hover:bg-emerald-900/60"
            >
              {isCreating ? 'Cancel' : '+ New Profile'}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-950/30 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {isCreating && (
            <div className="mt-6 glass rounded-[1.75rem] border border-emerald-300/30 p-6 shadow-green-sm">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-emerald-100">Profile name</span>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g. Home Gym"
                    className="w-full rounded-2xl border border-emerald-300/30 bg-emerald-950/50 px-4 py-3 text-emerald-100 outline-none transition focus:border-emerald-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateProfile();
                      }
                    }}
                    autoFocus
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
                >
                  Create profile
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.length === 0 ? (
              <div className="glass rounded-[2rem] border border-emerald-300/30 p-8 text-center text-emerald-200">
                No profiles yet. Create one to get started.
              </div>
            ) : (
              profiles.map((profile) => {
                const isActive = activeProfileId === profile.id;
                return (
                  <div
                    key={profile.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProfile(profile)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        handleSelectProfile(profile);
                      }
                    }}
                    className={`glass relative cursor-pointer overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/70 ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-900/60 shadow-green-lg'
                        : 'border-emerald-300/40 bg-emerald-950/40 hover:border-emerald-200/80 hover:bg-emerald-900/40'
                    }`}
                  >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile(profile.id);
                    }}
                    className="absolute right-4 top-7 rounded-full border border-emerald-300/40 bg-emerald-950/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-900/80"
                  >
                    Delete
                  </button>
                  {isActive ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        Active profile
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/20 to-transparent" />
                    <div className="relative flex items-start justify-center gap-4">
                      <div className="grid h-64 w-64 place-items-center rounded-full bg-emerald-200/10 text-3xl font-bold text-emerald-100 ring-1 ring-emerald-300/30">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="relative mt-6 flex flex-col justify-center text-center">
                      <div className="text-xl font-semibold text-emerald-50">{profile.name}</div>
                      <div className="mt-2 text-sm text-emerald-200/85">
                        Created {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
