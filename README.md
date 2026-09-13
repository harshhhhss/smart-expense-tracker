# ExpenseIQ

A personal expense tracker that categorises your spending from a plain-text description, then forecasts where the month will land.

## What it does

Most expense trackers ask you to pick a category from a dropdown every time you log something. ExpenseIQ reads what you typed — "uber to the airport", "swiggy dinner with friends" — and picks the category itself using keyword scoring, so logging an expense is one field and an amount.

Once there's a few weeks of data it does the things a spreadsheet won't: projects the month-end total from your current pace, flags transactions that are unusually large against your own average, and turns your income into 50/30/20 budget limits you can track against. There's no bank linking — every expense is one you entered, which keeps the data small, private, and yours.

Built as a full-stack portfolio project: React + Vite on the front, Express + MongoDB behind it, JWT auth in between.

## Screenshots

<!-- add screenshot here: the landing page hero -->
![Landing page](docs/screenshots/landing.png)

<!-- add screenshot here: dashboard in dark mode, with a few weeks of expenses logged -->
![Dashboard](docs/screenshots/dashboard.png)

<!-- add screenshot here: analytics page showing the forecast and anomaly panels -->
![Analytics](docs/screenshots/analytics.png)

<!-- add screenshot here: same dashboard in light mode, to show the theme system -->
![Light theme](docs/screenshots/light-theme.png)

## Features

### Authentication
- Email + password signup and login
- Passwords hashed with bcrypt (10 rounds); the hash is never returned in any response
- Stateless JWT sessions, 7-day expiry by default
- Protected routes on both the API and the client router

### Expense tracking
- Create, edit and delete expenses (amount, category, description, date)
- Search by description or amount, filter by category and date range
- 12 fixed categories, enforced by the database schema
- CSV export, plus a print-to-PDF report

### Smart categorisation
- Type a description and the category is detected as you type (600 ms debounce)
- Weighted keyword matching across 8 category dictionaries — multi-word phrases score highest, then longer keywords
- Auto-assigned expenses are tagged so you can tell them apart from ones you set by hand
- Always overridable; the dropdown stays editable

### Analytics
- Month-to-date total, previous month, and month-over-month change
- Category breakdown (donut) and a six-month spend trend (bar)
- Month-end forecast projected from your current daily pace, with a confidence band
- Anomaly detection that flags transactions far above your own average
- Written insights summarising what changed this month

### Budget planning
- Overall monthly limit plus per-category limits
- 50/30/20 recommendations derived from your income (or estimated from your spending if you haven't entered one)
- A spending health score, and alerts at 80% / 90% of a limit

### Shared groups
- Create a group and share an 8-character invite code
- Add a group expense; it splits equally across members automatically
- Per-member balance tracking (paid vs owed) and per-split settle-up

### Interface
- Dark and light themes, remembered across sessions
- Responsive down to phone width
- Public landing page for logged-out visitors; the dashboard for everyone else

## Tech stack

**Frontend**
| Package | Purpose |
|---|---|
| react 19 | UI |
| react-router-dom 7 | Routing |
| recharts 3 | Donut, bar and area charts |
| axios 1 | HTTP client with a JWT request interceptor |
| lucide-react 1 | Icons |
| vite 8 | Dev server and build |

**Backend**
| Package | Purpose |
|---|---|
| express 4 | HTTP server and routing |
| mongoose 8 | MongoDB ODM and schema validation |
| jsonwebtoken 9 | JWT signing and verification |
| bcryptjs 2 | Password hashing |
| cors 2 | Cross-origin config |
| dotenv 16 | Environment variables |
| nodemon 3 | Dev auto-restart |

**Database:** MongoDB (developed against Atlas)

## Setup

Requires Node 18+ and a MongoDB database (Atlas free tier is fine).

```bash
git clone https://github.com/harshhhhss/smart-expense-tracker.git
cd smart-expense-tracker
```

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```ini
PORT=5000
MONGO_URI=          # connection string from MongoDB Atlas -> Connect -> Drivers
JWT_SECRET=         # any long random string: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=         # your deployed frontend origin; leave blank for local dev
```

The server checks `MONGO_URI` and `JWT_SECRET` on boot and exits with a clear message if either is missing.

```bash
npm run dev     # nodemon, http://localhost:5000
npm start       # plain node
```

> **Note on `MONGO_URI`:** Atlas hands you a `mongodb+srv://` string by default, which needs a DNS SRV lookup. If your network blocks SRV queries you'll see `querySrv ECONNREFUSED`. Use the seed-list form instead — Atlas → Connect → Drivers → "Node.js 2.2.12 or later".

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

Optionally create `frontend/.env`:

```ini
VITE_API_URL=http://localhost:5000/api
```

Other commands: `npm run build`, `npm run preview`, `npm run lint`.

## Project structure

```
smart-expense-tracker/
├── backend/
│   ├── config/db.js            MongoDB connection
│   ├── controllers/            Request handlers (auth, expense, advanced, recurring)
│   ├── middleware/             JWT verification; 404 and typed error handling
│   ├── models/                 Mongoose schemas (User, Expense, Budget, SharedGroup, RecurringExpense)
│   ├── routes/                 Route definitions, grouped by resource
│   ├── utils/                  Categorisation, analytics and insight generation
│   └── server.js               App entry: env check, CORS, route mounting
└── frontend/
    └── src/
        ├── api/axios.js        Axios instance; attaches the JWT
        ├── components/         Reusable UI (charts, forms, panels, toasts)
        ├── context/            Auth, Theme and Toast providers
        ├── hooks/              useToast, useBudgetAlert
        ├── pages/              One file per route
        ├── styles/             design-system.css — every colour and type token
        ├── theme/palette.js    Category-to-colour mapping
        └── utils/              CSV and PDF export
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together and why.

## Known limitations

Honest list of what isn't finished:

- **Recurring expenses have no UI.** The API, model and scheduling logic are complete and tested by hand, but no page routes to them yet — the components exist and aren't imported.
- **The `/api/recurring/process` endpoint has no auth.** It's intended for a cron job and needs a shared-secret check before this is deployed anywhere public.
- **Budget progress compares all-time spend to a monthly limit.** `GET /api/advanced/budget` totals every expense rather than the current month, so the bars over-report after your first month.
- **The category list is defined in several places** and has drifted — `Transport` exists in the database schema but no keyword maps to it, so auto-detection never returns it.
- **The forecast is a straight-line projection**, not a regression. It's honest arithmetic but naive: one large expense early in the month skews it. See ARCHITECTURE.md.
- **No automated tests.** Verified manually and with ESLint only.
- **No rate limiting** on the auth endpoints.

## Roadmap

- Wire up the recurring-expenses UI and secure the cron endpoint
- Scope budget queries to the current month
- One shared category constant across client and server
- Weight the forecast toward recent months instead of a flat daily rate
- Per-user data export and account deletion

## License

MIT — see [LICENSE](LICENSE).
