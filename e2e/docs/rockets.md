# Rockets

Acceptance criteria for the rocket fleet catalog. API values for range are `earth`, `moon`, and `mars`. Capacity is always 9.

- AC-RKT-01. A session creates a rocket with a non-empty name and a known range. The rocket comes back with capacity 9 and enabled.
- AC-RKT-02. An empty name or an unknown range is rejected with 400 and does not create a rocket.
- AC-RKT-03. A capacity other than 9 is rejected with 400 on create and on update.
- AC-RKT-04. A duplicate name, ignoring letter case, is rejected with 409.
- AC-RKT-05. The fleet list includes disabled rockets.
- AC-RKT-06. One existing rocket returns name, range, capacity 9, and disabled state.
- AC-RKT-07. An unknown id returns 404.
- AC-RKT-08. Updating name or range keeps capacity 9 and the disabled state.
- AC-RKT-09. A patch without name and range returns 400 and does not change the rocket.
- AC-RKT-10. Disabling an enabled rocket keeps it in the catalog and marks it disabled.
- AC-RKT-11. Disabling an already disabled rocket returns 409.
- AC-RKT-12. A request without a valid session returns 401 and does not change the fleet.
- AC-RKT-13. The fleet page shows name, range, capacity 9, and status.
- AC-RKT-14. The create form asks for name and range, shows capacity 9 as fixed, and opens the new rocket.
- AC-RKT-15. Editing a rocket shows the new name and range on the detail.
- AC-RKT-16. Disabling a rocket shows it as disabled and removes the Disable button.
- AC-RKT-17. Opening the fleet, the create form, or a detail without a session goes to login.
- AC-RKT-18. The API does not expose delete or re-enable.
