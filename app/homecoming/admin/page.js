import { redirect } from 'next/navigation';

// The Home Coming guest list now lives inside the main Couple's Dashboard
// (as its own "Home Coming" tab), instead of a separate admin page — so
// this old URL just sends you there.
export default function HomecomingAdminRedirect() {
  redirect('/wedding/admin');
}
