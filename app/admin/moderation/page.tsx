'use client';
export const dynamic = 'force-dynamic';

// Reuse the main moderation UI
import ModerateAds from '../moderate/page';

export default function AdminModerationPage() {
  return <ModerateAds />;
}
