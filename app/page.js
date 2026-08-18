'use client';

// The bare domain (chathurajayawardhane.com) now shows the Guest Wishes
// display — the same rotating-wishes screen as /wishes-display — meant for
// a TV or monitor at the venue. Re-using that page's component here instead
// of duplicating its code.
import WishesDisplayPage from './wishes-display/page';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  return <WishesDisplayPage />;
}
