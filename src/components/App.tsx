import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import ProfileSelector from '../components/ProfileSelector';
import Dashboard from '../components/Dashboard';
import ExerciseList from '../components/ExerciseList';
import WorkoutList from '../components/WorkoutList';
import ProgressionChart from '../components/ProgressionChart';
import BodyweightChart from '../components/BodyweightChart';
import VolumeChart from '../components/VolumeChart';

interface AppProps {
  page: 'dashboard' | 'exercises' | 'workouts' | 'analytics';
}

export default function App({ page }: AppProps) {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('activeProfileId');
    if (stored) {
      const profileId = parseInt(stored);
      // Load profile details if needed, but for now assume we have it
      // For simplicity, we'll store the full profile in localStorage
      const profileData = localStorage.getItem('activeProfile');
      if (profileData) {
        setActiveProfile(JSON.parse(profileData));
      }
    }
  }, []);

  const handleProfileSelect = (profile: Profile) => {
    setActiveProfile(profile);
    localStorage.setItem('activeProfileId', profile.id.toString());
    localStorage.setItem('activeProfile', JSON.stringify(profile));
  };

  if (!activeProfile) {
    return <ProfileSelector onProfileSelect={handleProfileSelect} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard profileId={activeProfile.id} />;
      case 'exercises':
        return <ExerciseList profileId={activeProfile.id} />;
      case 'workouts':
        return <WorkoutList profileId={activeProfile.id} />;
      case 'analytics':
        return (
          <div className="space-y-8">
            <ProgressionChart profileId={activeProfile.id} />
            <BodyweightChart profileId={activeProfile.id} />
            <VolumeChart profileId={activeProfile.id} />
          </div>
        );
      default:
        return <Dashboard profileId={activeProfile.id} />;
    }
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Profile: {activeProfile.name}</span>
          <button
            onClick={() => {
              setActiveProfile(null);
              localStorage.removeItem('activeProfileId');
              localStorage.removeItem('activeProfile');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Switch Profile
          </button>
        </div>
      </div>
      {renderPage()}
    </div>
  );
}