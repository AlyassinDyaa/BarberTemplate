# Barber Portfolio Template

A responsive, accessible portfolio site for an independent barber, with an **owner-only admin panel** for editing everything without touching code.

**Look:** a clean, contained portfolio in navy, cream and barber red, set in one typeface (Schibsted Grotesk). **Light:** cream with navy text and navy feature panels. **Dark:** midnight navy with cream text. The hero is a poster: your name set huge across the page with your portrait laid over it, then your intro, booking buttons and four recent cuts; each one opens that cut in the cut explorer. Both modes have a live Open now / Closed sign worked out from your hours (set your time zone under Shop & hours). Colours, fonts and corners can all be changed in the admin panel. It has no dependencies: plain HTML/CSS/JS plus a small Node server.

## Quick start

```bash
node server.js
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin.html

On your first visit to the admin page it asks you to **create your admin password**. To reset a forgotten password, delete `data/admin.json` and restart the server.

## Admin panel

Everything on the site can be edited from `/admin.html`, and changes appear in a **live preview** before you publish:

| Section | What you can change |
| --- | --- |
| Look & feel | Default colour mode (system / dark / light), accent colour (presets or any colour, with a contrast check), font style, corners |
| Profile & contact | Name, title, city, stats, phone, email, online booking link, social links |
| Hero | Headline lines, intro, your photo (upload or URL) with alt text, availability note, stats. The strip of cuts under your name comes from the Cuts section |
| About | Heading, paragraphs, highlights, photo |
| Section headings | Label, heading and intro text for every section |
| Shop & hours | Current shop, address, map link, access info, opening hours |
| Services & prices | Add, edit, reorder or remove services |
| Cuts | The cut explorer and cut finder: photo, what to ask for, upkeep, product, linked service, quiz matching |
| Portfolio | Photos (upload), captions, categories |
| Reviews | Add, edit, reorder or remove |
| Show / hide sections | About, cut finder, clipper guide, portfolio, reviews |
| Account & backup | Change password, download config, restore from file, discard unsaved changes |

- **Publish changes** (or Ctrl/Cmd + S) writes `js/config.js`, so the change goes live for every visitor right away.
- Before publishing, the admin checks for missing names, photos and alt text, and for duplicate IDs. It lists any problems with links to each field.
- Unsaved edits are kept as a draft in your browser, so a refresh doesn't lose them.
- Each publish keeps a backup in `data/backups/` (the last 20).
- Uploaded photos are saved to `assets/uploads/`.
- Visitors still get a sun/moon toggle in the header for light/dark mode, and their choice is remembered.

## Security notes

- The password is stored as a salted scrypt hash in `data/admin.json`. Sessions use HttpOnly, SameSite=Strict cookies and last 12 hours.
- After 5 failed logins from one address, login is locked for a minute. Requests from other websites are rejected.
- `data/`, `server.js` and dotfiles are never served to visitors.
- **When you host it publicly, run it behind HTTPS** (for example Render, Railway, Fly.io or a VPS with Caddy or nginx).

## Hosting without Node

The site itself is static. If you host it on Netlify, GitHub Pages or similar, edit locally with `node server.js` and upload the files afterwards. The admin panel's **Download config file** button also gives you the file to upload.

### Vercel

Import the GitHub repo in Vercel. `vercel.json` sets it up as a static site, so leave the framework as **Other** with no build command. On Vercel the admin page only shows "Admin needs the site server", because it can't save there. Make your changes locally with `node server.js`, then commit and push `js/config.js` (and any photos you uploaded). Vercel redeploys on every push.

## Files

| File | What it is |
| --- | --- |
| `server.js` | Static file server and admin API (no npm packages) |
| `admin.html`, `js/admin.js`, `css/admin.css` | The admin panel |
| `js/config.js` | All site content and settings. Written by the admin panel, and still editable by hand as JSON |
| `js/core.js` | Applies the theme before the page appears and keeps text contrast at 4.5:1 or higher for any accent colour |
| `js/main.js` | Renders the site from the config and runs the interactive parts |
| `index.html`, `accessibility.html`, `css/styles.css` | The public site |

## Accessibility (WCAG 2.2 AA)

The public site **and** the admin panel were tested with axe-core 4.10 (WCAG 2.0, 2.1 and 2.2 A/AA plus best practices) at phone and desktop widths, in light and dark themes, with no violations remaining. Every feature works with a keyboard and has visible focus. Dialogs keep focus inside them. Form errors are linked to their fields. Touch targets are at least 44px, and nothing scrolls sideways from 320px up.

Stock photos are from [Unsplash](https://unsplash.com/license) (free for commercial use). Replace them with your own work from the admin panel.
