# Architecture

How ExpenseIQ is put together, and why. This describes what is actually implemented — where something is naive or unfinished, it says so.

---

## 1. High-level shape

Three tiers, no middleware layer between them, no server-side rendering.

```
┌─────────────────────────────┐
│  Browser — React SPA        │
│  Vite dev server :5173      │
│                             │
│  AuthContext ─ user + JWT   │
│  ThemeContext ─ dark/light  │
│  ToastContext ─ messages    │
│        │                    │
│  axios instance             │
│  └─ request interceptor     │
│     attaches Bearer token   │
└───────────┬─────────────────┘
            │  JSON over HTTP, CORS-allowlisted
            ▼
┌─────────────────────────────┐
│  Express API :5000          │
│                             │
│  cors → express.json()      │
│    → route dispatch         │
│    → authMiddleware (JWT)   │
│    → controller             │
│    → utils (analytics etc.) │
│    → notFound → errorHandler│
└───────────┬─────────────────┘
            │  Mongoose ODM
            ▼
┌─────────────────────────────┐
│  MongoDB (Atlas)            │
│  users · expenses · budgets │
│  sharedgroups · recurring   │
└─────────────────────────────┘
```

### Auth flow

```
SIGN UP / LOG IN
  client  POST /api/auth/signup { name, email, password }
  server  validate → bcrypt.hash(password, 10) → User.create
          → jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" })
          → 201 { token, user: { _id, name, email } }     ← never the hash
  client  localStorage.setItem("token" | "user") → AuthContext state

EVERY SUBSEQUENT REQUEST
  client  axios interceptor → Authorization: Bearer <token>
  server  authMiddleware:
            header startsWith "Bearer " ?      → else 401
            jwt.verify(token, JWT_SECRET)      → else 401
            User.findById(decoded.id)
              .select("-password")             → else 401
            req.user = user → next()

SESSION RESTORE (page refresh)
  client  read localStorage → optimistically set user
          → GET /api/auth/me to confirm the token is still valid
          → on failure, clear storage and drop to logged-out
```

The token is the whole session. There is no server-side session store, no refresh-token rotation, and no logout endpoint — logging out clears `localStorage` on the client and the old token simply remains valid until it expires.

---

## 2. Folder responsibilities

### `backend/`

| Path | Responsibility |
|---|---|
| `server.js` | Entry point. Loads env, **fails fast if `MONGO_URI` or `JWT_SECRET` is missing**, configures CORS, mounts the four route groups, installs the error middleware last. |
| `config/db.js` | Single Mongoose connection. Exits the process on failure rather than serving a half-dead API. |
| `routes/` | Route tables only — path, method, whether `authMiddleware` applies, and which controller runs. No logic. |
| `controllers/` | Request/response handling: read `req`, validate input, call models and utils, shape the JSON. Every async handler is wrapped in `try/catch` and delegates failures to `next(error)`. |
| `middleware/authMiddleware.js` | Extracts and verifies the JWT, loads the user without the password hash, assigns `req.user`. |
| `middleware/errorMiddleware.js` | `notFound` (404) plus a typed `errorHandler`. `classifyError` maps Mongoose `ValidationError`, `CastError` and duplicate-key (11000) to **400 with a useful message**, everything else to 500. Stack traces are suppressed when `NODE_ENV=production`. |
| `models/` | Mongoose schemas. Validation lives here (required fields, enums, minimums) so it holds regardless of which controller writes. |
| `utils/analytics.js` | Pure functions over an expense array — totals, category breakdown, monthly buckets, prediction, anomaly detection. No database access, which makes them trivially testable. |
| `utils/autoCategory.js` | The keyword dictionaries and scoring for category detection. |
| `utils/insights.js` | Turns analytics output into human-readable sentences. |

### `frontend/src/`

| Path | Responsibility |
|---|---|
| `api/axios.js` | One axios instance with the base URL and a request interceptor that attaches the JWT. Every network call goes through it. |
| `context/AuthContext.jsx` | Session state: `user`, `loading`, `login`, `signup`, `logout`. Owns `localStorage` persistence. |
| `context/ThemeContext.jsx` | `dark` \| `light`, persisted, applied as `data-theme` on `<html>`. |
| `context/ToastContext.jsx` | Transient messages; the provider value is memoised so consumers don't re-render on every tick. |
| `pages/` | One component per route. Each page owns its own data fetching. |
| `components/` | Reusable UI. Presentational except where a panel fetches its own slice (`PredictionPanel`, `AnomalyPanel`, `BudgetPlanner`). |
| `styles/design-system.css` | **The only place colours, type sizes, radii and spacing are defined.** Two token blocks — `:root` for dark, `[data-theme="light"]` for light. Components reference `var(--token)` and never literals. |
| `theme/palette.js` | Category → colour-token map, the ordered chart series, and `tint()` for translucent fills. Single source of truth so "Food" is the same colour in the donut, the badges and anywhere added later. |
| `hooks/` | `useToast`, `useBudgetAlert` (derives threshold alerts from expenses + budget). |
| `utils/exportUtils.js` | CSV generation and the print-window PDF report. |

---

## 3. Design decisions

### Why JWT rather than sessions

Stateless. The API stores nothing per-login, so there's no session table to keep, expire or replicate, and the server can restart or scale horizontally without logging anyone out. The signed payload is just `{ id }` — the middleware still loads the user from the database on every request, so a deleted or changed account takes effect immediately rather than waiting for the token to expire.

The trade-off is real: **a token cannot be revoked before it expires.** Logout is client-side only. For an app with no money movement and a 7-day expiry that's an acceptable trade; anything handling real transactions would need refresh tokens and a revocation list.

### How category auto-detection actually works

**It is keyword matching, not machine learning.** There is no model, no training data, and no external API. Calling it "AI" would be overselling a dictionary lookup.

`backend/utils/autoCategory.js` holds eight arrays of keywords — `Food`, `Travel`, `Shopping`, `Entertainment`, `Education`, `Health`, `Bills`, `Work` — roughly 25 terms each, weighted toward Indian services (swiggy, zomato, irctc, ola, flipkart).

```
normalise(description)
  lowercase → strip non-alphanumerics → collapse whitespace

for each category:
  score = Σ weight(keyword) for every keyword found as a substring

  weight(keyword):
    contains a space  → 4     ("air india" beats a bare "air")
    length ≥ 8        → 3
    length ≥ 5        → 2
    otherwise         → 1

pick the highest score; ties break alphabetically
no keyword matched → "Miscellaneous"
```

Multi-word phrases score highest because they're the least ambiguous. The whole thing is a synchronous pure function — it runs in well under a millisecond, needs no network call, and behaves identically every time.

**Where it falls down:** substring matching has no word boundaries, so "carpet" contains "car". It cannot learn from corrections. And it has a live gap — `Transport` is a valid category in the schema but has **no keyword block at all**, so the detector can never return it; uber, ola and taxi are filed under `Travel`.

### How the spending prediction works

**Straight-line projection from the current daily rate.** Not linear regression, despite what an older comment in the code claimed.

```js
spentSoFar          = total of this month's expenses
currentDay          = today's date (1-31)
daysInMonth         = days in the current month
predictedMonthlySpend = round((spentSoFar / currentDay) * daysInMonth)

lower = predicted * 0.85
upper = predicted * 1.15
```

The ±15% band is a fixed multiplier, not a computed interval. The confidence percentage is a lookup on how many expenses exist, not a statistical measure:

| Expenses recorded | Confidence shown |
|---|---|
| ≥ 12 | 82% |
| ≥ 6 | 68% |
| fewer | 45% |

A separate `getTrend()` compares the first and last non-empty months of the last six and returns `increasing` / `decreasing` / `stable` on a ±10% threshold.

**Known weakness:** the daily rate is flat, so it assumes spending is uniform across the month. Rent paid on the 1st makes the 2nd-of-the-month forecast wildly high. Weighting recent days, or modelling recurring expenses separately, is the obvious next step.

### How anomaly detection works

**Mean-multiple thresholding. There is no z-score and no standard deviation.**

```js
if (expenses.length < 3) return []          // too little data to judge

average = total(expenses) / expenses.length  // mean of ALL expenses, all time

flag any expense where amount > average * 2
  amount > average * 3  → "critical"
  otherwise             → "warning"
```

The per-category average is then computed only to write the message ("Food spend is higher than your usual Rs 420 pattern") — it plays no part in deciding what gets flagged.

**Known weaknesses:** using the mean makes the detector self-defeating, since one huge expense drags the average up and hides the next one. A median with a MAD threshold, or a genuine per-category z-score, would be more robust. It also scans your entire history rather than a rolling window, so it re-flags the same year-old transaction forever.

### Other trade-offs

**No bank linking, by design.** Every expense is typed in by hand. That costs convenience and means the data is only as complete as the user is diligent — but it needs no Plaid-style aggregator, no OAuth against financial institutions, no storage of third-party access tokens, and no regulatory surface. For a portfolio project it keeps the security story simple and honest: the only sensitive data is a bcrypt hash.

**Analytics computed on read, not stored.** Every dashboard load fetches the user's full expense history and recomputes totals, buckets, forecast and anomalies in memory. Simple and always consistent — no cache to invalidate — but it's O(n) per request and will need pre-aggregation or a MongoDB aggregation pipeline once a user has thousands of expenses.

**Inline styles over CSS modules.** Components carry a local `styles` object rather than separate stylesheets. Co-locating style with markup suits single-file components, and everything still resolves through `var(--token)` so theming works globally. The cost is no pseudo-selectors or media queries inline — those live in `design-system.css` and a handful of class names.

**Equal splits only.** Group expenses divide evenly across members at the time of creation. The UI for custom splits exists but the API ignores it.

---

## 4. Data models

### User — `models/User.js`
| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trimmed |
| `email` | String | required, **unique**, lowercased, trimmed |
| `password` | String | required, min 6 — stores the bcrypt hash, never the plaintext |
| `createdAt` / `updatedAt` | Date | timestamps |

Responses go through a `publicUser()` helper that returns only `_id`, `name`, `email`.

### Expense — `models/Expense.js`
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required, **indexed** — every query is scoped by it |
| `amount` | Number | required, min 0.01 |
| `category` | String | enum of 12, defaults to `Miscellaneous` |
| `description` | String | trimmed, defaults to `""` |
| `date` | Date | defaults to now |
| `autoTagged` | Boolean | true when the category came from detection, not the user |

Categories: Food, Transport, Shopping, Entertainment, Bills, Work, Health, Education, Travel, Utilities, Personal Care, Miscellaneous.

### Budget — `models/Budget.js`
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required, **unique** — one budget document per user |
| `monthlyLimit` | Number | defaults 0; derived from the sum of `limits` when not sent explicitly |
| `income` | Number | defaults 0; drives the 50/30/20 split |
| `limits` | Map&lt;String, Number&gt; | per-category caps |

### SharedGroup — `models/SharedGroup.js`
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `emoji` | String | display label |
| `inviteCode` | String | **unique, indexed** — 8 chars, generated and collision-checked on create |
| `createdBy` | ObjectId → User | required |
| `members` | [ObjectId → User] | membership is the access check for every group route |
| `expenses` | [groupExpenseSchema] | embedded, not a separate collection |

Each embedded group expense holds `description`, `amount`, `category`, `date`, `paidBy`, and `splits[]` — where a split is `{ user, amount, settled }`. Embedding keeps a group's whole ledger in one document, which suits reads (one query renders the detail page) at the cost of an unbounded array on a very active group.

Balances are computed on read: `paid − owed` per member, where `owed` counts only unsettled splits.

### RecurringExpense — `models/RecurringExpense.js`
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required, indexed |
| `amount` | Number | required, min 0.01 |
| `category` | String | required, enum of 11 — **missing `Work`**, unlike Expense |
| `frequency` | String | daily \| weekly \| biweekly \| monthly \| quarterly \| yearly |
| `startDate` / `endDate` | Date | `endDate` null means open-ended |
| `lastCreated` | Date | when this last produced an Expense |
| `active` | Boolean | defaults true |

`POST /api/recurring/process` walks every active rule, and where enough time has elapsed since `lastCreated` it writes a real `Expense` and stamps `lastCreated`. Intended for a daily cron.

---

## 5. API reference

Base URL `/api`. "Auth" means a valid `Authorization: Bearer <token>` header is required.

### Authentication — `/api/auth`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/signup` | — | Create an account; returns token + public user |
| POST | `/login` | — | Exchange credentials for a token |
| GET | `/me` | ✅ | Current user; used to validate a restored session |

### Expenses — `/api/expenses`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | ✅ | List expenses. Query: `search`, `category`, `startDate`, `endDate` |
| POST | `/` | ✅ | Create an expense; auto-categorises when no category is sent |
| PUT | `/:id` | ✅ | Update an expense you own |
| DELETE | `/:id` | ✅ | Delete an expense you own |
| POST | `/detect-category` | ✅ | Category for a description, without saving anything |

### Analytics and budgets — `/api/advanced`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/dashboard` | ✅ | Summary, chart data, insights, forecast and anomalies in one payload |
| GET | `/analytics` | ✅ | Alias of `/dashboard` |
| GET | `/budget` | ✅ | Budget, per-category spend, and limit status |
| POST | `/budget` | ✅ | Upsert monthly limit, income and category limits |
| GET | `/budget/recommend` | ✅ | 50/30/20 recommendations. Query: `income` |
| GET | `/predict` | ✅ | Month-end forecast plus six-month history |
| GET | `/anomalies` | ✅ | Flagged transactions with severity counts |

### Shared groups — `/api/advanced`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/groups` | ✅ | Groups you belong to |
| POST | `/groups` | ✅ | Create a group; generates a unique invite code |
| POST | `/groups/join` | ✅ | Join via invite code |
| GET | `/groups/:id` | ✅ | Group detail with computed balances |
| POST | `/groups/:id/expenses` | ✅ | Add an expense, split equally |
| PATCH | `/groups/:id/expenses/:expenseId/settle` | ✅ | Mark your own split settled |

### Recurring expenses — `/api/recurring`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | ✅ | List your recurring rules |
| POST | `/` | ✅ | Create a rule |
| PUT | `/:id` | ✅ | Update a rule |
| DELETE | `/:id` | ✅ | Delete a rule |
| POST | `/process` | ⚠️ **none** | Generate due expenses for **all** users. Intended for cron; **needs a shared-secret guard before deployment** |

No endpoint under `/api/recurring` is reachable from the UI yet.

### Error shape

Every error returns the same JSON:

```json
{ "message": "Amount must be a positive number", "stack": "..." }
```

`stack` is `null` when `NODE_ENV=production`. Status codes: **400** validation/cast/duplicate-key, **401** missing or invalid token, **404** not found or not yours, **500** everything else.

Ownership is enforced in the query rather than by a separate check — `findOneAndUpdate({ _id, user: req.user._id })` — so another user's ID returns 404 instead of leaking that the record exists.
