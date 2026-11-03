# Selavu Kanakku — செலவுக் கணக்கு

A mobile-friendly Tamil expense tracker built with HTML, CSS and vanilla JavaScript. Includes email signup/login, daily expense creation and editing, confirmed deletion, category filters, month selection, INR totals and proportional category summaries. No build step or CDN dependencies.

## Hosting

Place `index.html`, `style.css`, `app.js` and the **provided `godai-db.js` helper** in the same directory. The helper is supplied by the GOD AI platform and is intentionally not implemented in this project. Serve over HTTP or deploy this directory to GitHub Pages. Relative paths support project Pages URLs.

Without the provided helper, the page explains the connection issue and disables authentication submission. No fake authentication or local-only substitute is used.

## Account and storage

The app uses GodDB `signUp`, `signIn`, `signOut`, `user` and `onAuth`. Signup may require email confirmation. Configure the provided service for your deployed origin and confirmation flow as required by that service.

Expenses are saved through GodDB in the `expenses` collection:

- `amount`: positive INR number, rounded to two decimals
- `date`: local-calendar `YYYY-MM-DD`
- `category`: one of the eight Tamil categories
- `description`: optional plain-text note, up to 160 characters

GodDB supplies record IDs and creation timestamps. Per-user access isolation must be enforced by the provided GodDB service; the frontend relies on its documented user-scoped operations. Credentials and expenses are not stored in localStorage.

## Usage

Create an account, confirm your email if needed, then sign in. Enter amount, date and category; add an optional note. Saving selects that expense's month. Monthly cards and category bars always summarize the full selected month; the category filter affects only the expense list and its subtotal. Use “திருத்து” to edit, “நீக்கு” to delete with confirmation, and “புதுப்பி” to reload saved data. Empty months display a clear empty state. Landing-page example amounts are illustrative only and are never added to user data.
