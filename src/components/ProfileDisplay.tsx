import { useState, useEffect } from 'react';
import type { Profile } from '../types';

export function ProfileDisplay() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem('activeProfile');
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Failed to parse active profile:', e);
      }
    }

    // Listen for profile changes
    const handleStorageChange = () => {
      const updatedProfile = localStorage.getItem('activeProfile');
      if (updatedProfile) {
        try {
          setProfile(JSON.parse(updatedProfile));
        } catch (e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workout-saved', handleStorageChange); // Custom event for profile updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workout-saved', handleStorageChange);
    };
  }, []);

  if (!profile) {
    return null;
  }

  return (
    <a
      href="/profiles"
      className="text-emerald-200 font-medium text-sm no-underline transition-colors duration-200 hover:text-green-400"
    >
      {profile.name}
    </a>
  );
}