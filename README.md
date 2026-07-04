# Chathura & Lakmini — Wedding Invitation (Next.js)

## Setup / Run karana widiya

1. VS Code eken folder eka open karanna (`InviteGlow` folder).
2. Terminal eke:
   ```
   npm install
   npm run dev
   ```
3. Browser eke open karanna: http://localhost:3000
4. RSVP dashboard eka: http://localhost:3000/admin — passcode: `poruwa2026`
   (Change it in `app/admin/page.js`, the `PASSCODE` constant, at top of file.)

## Structure

- `app/page.js` — main invitation page (hero, schedule with live countdowns, RSVP form)
- `app/admin/page.js` — passcode-protected RSVP dashboard
- `app/api/rsvp/route.js` — saves RSVP responses to `data/rsvps.json`
- `app/globals.css` — light gold/rose color theme, fonts, all styling
- `data/rsvps.json` — RSVP responses get saved here (starts empty)

## Notes

- Wedding year is assumed to be **2026** based on the schedule you shared. If wrong, update the dates at the top of `app/page.js`.
- RSVP storage uses a local JSON file — this works great for `npm run dev` and most traditional hosting (VPS, `next start`). If you deploy to a serverless platform like Vercel, the filesystem is read-only in production, so you'd want to swap `data/rsvps.json` for a small database (e.g. Vercel KV, Supabase, or a Google Sheet) — happy to wire that up when you're ready to deploy.
- To change the color palette, edit the CSS variables at the top of `app/globals.css` (`--gold`, `--rose`, `--ink`, etc).
- To edit schedule items, times, or add new ceremonies, edit the `events` array at the top of `app/page.js`.
