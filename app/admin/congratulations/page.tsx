'use client';

import { useEffect } from 'react';

export default function CongratulationsRedirect() {
  useEffect(() => {
    // Redirect to the unified community admin page where 'მისალoczbi' now lives
    window.location.replace('/admin/community');
  }, []);

  return <div className="min-h-screen flex items-center justify-center text-white">გადამისამართება...</div>;
}