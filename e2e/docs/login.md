# Login

## Objective

Verify that a registered user can sign in to Astro-Bookings with email and
password, that the client stores the token, that the menu shows the user name,
and that `/me` displays a read-only profile from `GET /api/me`.

## Acceptance Criteria

| ID          | Scenario                                                            | Expected Output                                                             |
| ----------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| AC-LOGIN-01 | `POST /api/login` with a registered email and password              | `200` JSON with `id`, `email`, `name` and `token`; no password fields       |
| AC-LOGIN-02 | Submit the login form with valid credentials                        | Token stored in `localStorage["session"]`                                   |
| AC-LOGIN-03 | `POST /api/login` (and the form) with credentials that do not match | API `401` `{ error: "Invalid credentials" }`; UI alert; no token stored     |
| AC-LOGIN-04 | Missing or invalid email or password                                | API `400`; UI does not create a session (native invalid email or API error) |
| AC-LOGIN-05 | Open the app without a session                                      | Navigation includes a link to `/login`                                      |
| AC-LOGIN-06 | Open `/login`                                                       | Form with email and password fields                                         |
| AC-LOGIN-07 | Authenticated session                                               | Navigation shows the user name and a link to `/me`                          |
| AC-LOGIN-08 | Open `/me` while authenticated                                      | Page requests `GET /api/me` and shows id, email and name; no edit fields    |
| AC-LOGIN-09 | Open `/me` without a token, or with an invalid token                | API `401`; UI alert; no other user's profile is shown                       |

## Test Plan

- Suite: [`tests/login.api.spec.ts`](../tests/login.api.spec.ts) — AC-LOGIN-01, AC-LOGIN-03 (API), AC-LOGIN-04 (API), AC-LOGIN-09 (API)
- Suite: [`tests/login.page.spec.ts`](../tests/login.page.spec.ts) — AC-LOGIN-02, AC-LOGIN-03 (UI), AC-LOGIN-04 (UI), AC-LOGIN-05, AC-LOGIN-06, AC-LOGIN-07, AC-LOGIN-08, AC-LOGIN-09 (UI)
- Run: `bun test:e2e -- login`
- Report: `bun test:e2e:report` (HTML), `reports/results.json` (JSON)
