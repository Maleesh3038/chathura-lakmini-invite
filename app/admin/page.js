import { notFound } from 'next/navigation';

// Admin now lives at /wedding/admin instead. Keep this route blocked so the
// old /admin path (without the /wedding prefix) doesn't work anymore.
export default function OldAdminPage() {
  notFound();
}
