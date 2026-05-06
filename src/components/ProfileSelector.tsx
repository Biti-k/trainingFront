import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { api } from '../services/api';

interface ProfileSelectorProps {
  onProfileSelect: (profile: Profile) => void;
  selectedProfile?: Profile | null;
}

export default function ProfileSelector({ onProfileSelect, selectedProfile }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.profiles.list();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    try {
      const profile = await api.profiles.create({ name: newProfileName.trim() });
      setProfiles([...profiles, profile]);
      setNewProfileName('');
      setIsCreating(false);
      onProfileSelect(profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Select Profile</h1>

        <div className="space-y-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onProfileSelect(profile)}
              className={`w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                selectedProfile?.id === profile.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="font-medium">{profile.name}</div>
              <div className="text-sm text-gray-500">
                Created {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}

          {isCreating ? (
            <div className="border border-gray-300 rounded-lg p-4">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profile name"
                className="w-full p-2 border border-gray-300 rounded mb-3"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProfile()}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateProfile}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewProfileName('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              + Add New Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}