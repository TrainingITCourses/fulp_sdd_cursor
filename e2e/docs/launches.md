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

Cancellation is final. The cause type is `economic`, `meteorological`, or `technical`, with a text. The server records the time and the session user. The detail shows that record. The list shows the cancelled status only.

- AC-CNL-01. A session cancels a planned or confirmed launch with a cause type and a non-empty text. The launch comes back cancelled, with the cause, an ISO 8601 time, and the session user.
- AC-CNL-02. A cause type outside the three values, or an empty text, is rejected with 400 and does not cancel the launch.
- AC-CNL-03. A body that includes the time or the user is rejected with 400 and does not cancel the launch.
- AC-CNL-04. A successful or already cancelled launch is rejected with 409 and is not changed.
- AC-CNL-05. An unknown launch id is rejected with 404.
- AC-CNL-06. A cancel without a valid session returns 401.
- AC-CNL-07. Reading a cancelled launch returns the cause, the time, and the user who cancelled it.
- AC-CNL-08. Reading a launch that is not cancelled returns an empty cancellation.
- AC-CNL-09. The detail of a planned launch asks for the cause type and a text, then shows cancelled status, the cause, the time, and the user name.
- AC-CNL-10. The detail of an already cancelled launch shows the cause, the time, and the user name, and does not show the form.
- AC-CNL-11. The detail of a successful launch does not show the cancel form.
- AC-CNL-12. The launches page shows status cancelled and does not show the cause, the time, or the user.
- AC-CNL-13. Opening a detail without a session goes to login (same path as AC-LCH-13).
- AC-CNL-14. A second cancel does not replace the stored cause, time, or user.
