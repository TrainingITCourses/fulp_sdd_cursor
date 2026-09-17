# Register

## Objective

Verify that a visitor can create an Astro-Bookings account with email, name and
password, that the API rejects duplicates and invalid data, and that a successful
register leaves a token in the client.

## Acceptance Criteria

| ID        | Scenario                                                         | Expected Output                                                              |
| --------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| AC-REG-01 | `POST /api/register` with valid email, name and password         | `201` JSON with `id`, `email`, `name` and `token`; no password fields        |
| AC-REG-02 | Submit the register form with valid data                         | Success message; `localStorage["session"]` contains a token                  |
| AC-REG-03 | `POST /api/register` (and the form) with an email already in use | API `409` `{ error: "Email already registered" }`; UI alert; no token stored |
| AC-REG-04 | Missing or invalid email, name or password                       | API `400`; UI does not create a session (native invalid email or API error)  |
| AC-REG-05 | Open the app                                                     | Navigation includes a link to `/register`                                    |
| AC-REG-06 | Open `/register`                                                 | Form with email, name and password fields                                    |

## Test Plan

- Suite: [`tests/register.api.spec.ts`](../tests/register.api.spec.ts) — AC-REG-01, AC-REG-03 (API), AC-REG-04 (API)
- Suite: [`tests/register.page.spec.ts`](../tests/register.page.spec.ts) — AC-REG-02, AC-REG-03 (UI), AC-REG-04 (UI), AC-REG-05, AC-REG-06
- Run: `bun test:e2e -- register`
- Report: `bun test:e2e:report` (HTML), `reports/results.json` (JSON)
