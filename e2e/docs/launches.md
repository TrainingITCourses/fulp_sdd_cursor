# Launches

Acceptance criteria for planning future launches. A launch is created as `planned`. The date is ISO 8601 and must be in the future. The rocket must exist and stay enabled. Price per passenger is a number greater than zero.

- AC-LCH-01. A session plans a launch for an enabled rocket, a future date, and a price per passenger greater than zero. The launch comes back with status `planned`.
- AC-LCH-03. A disabled rocket is rejected with 409 and does not create a launch. The plan form does not offer disabled rockets.
- AC-LCH-04. A date that is not in the future is rejected with 400 and does not create a launch. The plan form stays on the form and asks for a future date.
- AC-LCH-07. A request without a valid session returns 401 and does not create or read launches.
- AC-LCH-08. The launch list returns rocket, date, price per passenger, and status, ordered by date.
- AC-LCH-09. One existing launch returns rocket, date, price per passenger, and status `planned`.
- AC-LCH-11. The plan form asks for an enabled rocket, a future date, and the price per passenger, then opens the detail in status planned.
- AC-LCH-12. The launches page shows date, rocket, price per passenger, and status.
- AC-LCH-13. Opening the list, the plan form, or a detail without a session goes to login.
