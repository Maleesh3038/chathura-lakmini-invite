import { notFound } from 'next/navigation';

// The wedding invitation site intentionally lives at /wedding, not at the
// domain root. Visiting the bare domain (chathurajayawardhane.com) should
// show nothing — this route is reserved for something else later.
export default function RootPage() {
  notFound();
}
