# Application Tracker (Kanban) — Implementation Notes

## What it is
A drag-and-drop Kanban board where users track scholarship applications across 5 stages:

**Saved → Preparing → Submitted → Waiting → Result**

## User surface
- **Page:** `/dashboard/tracker`
- **Also linked from:** `/dashboard` sidebar → "Tracker"
- **Sibling page:** `/dashboard/deadlines` for detailed deadline management

## Core UX
1. **Import saved scholarships** — one-click button that creates tracker rows for every save (into the "Saved" column) that isn't already tracked.
2. **Manual add** — `+` button per column opens a small modal (name, provider, URL, deadline).
3. **Drag & drop** — HTML5-native, no library. Any card can be dragged to any column. Optimistic UI + backend sync.
4. **Auto-timestamps** — moving to Submitted auto-stamps `submitted_date`; moving to Result auto-stamps `result_date` (both only if not already set).
5. **Result marking** — when a card is in Result column, edit modal shows 4 buttons: Accepted / Rejected / Waitlisted / Withdrawn.
6. **Notes** — free-text per card (up to 4,000 chars) for essay drafts, contact info, todo lists, etc.
7. **Deadline pill** — each card shows days-left color-coded (red ≤ 7, amber ≤ 14, gold otherwise).
8. **Delete** — from inside the edit modal.

## Data model

### `applications` collection
```
{
  id, user_id,
  scholarship_id, scholarship_slug,          // link to catalog if imported
  scholarship_name, scholarship_provider, scholarship_url,
  deadline_date,          // optional Date
  status,                 // 'saved'|'preparing'|'submitted'|'waiting'|'result'
  result,                 // null|'accepted'|'rejected'|'waitlisted'|'withdrawn'
  notes,                  // free text, up to 4000 chars
  submitted_date,         // auto-stamped when moved to 'submitted'
  result_date,            // auto-stamped when moved to 'result'
  display_order,          // int, sort order within a column
  created_at, updated_at
}
```

Indexes: `{user_id, status, display_order}` and `{user_id, updated_at:-1}`.

## API surface

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/applications` | list all my applications |
| `POST`   | `/api/applications/create` | new application (any column) |
| `POST`   | `/api/applications/import-saves` | bulk-import all saved scholarships as `saved` |
| `PATCH`  | `/api/applications/:id` | partial update (status, notes, deadline, result) |
| `DELETE` | `/api/applications/:id` | delete |

All endpoints require session (`sf_session` cookie). 401 if unauthenticated.

**Note on naming:** the legacy `/api/tracker` endpoint (older `trackers` collection) was left untouched to avoid breaking anything. The new Kanban lives at `/api/applications`.

## E2E test coverage (verified via curl)
- Create in any of 5 columns ✅
- List returns all apps sorted by status + display_order ✅
- PATCH status → auto-stamps submitted_date / result_date ✅
- PATCH result with allowed value ✅
- DELETE ✅
- Import-saves (idempotent, only adds new ones) ✅
- 401 without session ✅

## Design considerations

- **Optimistic UI** on drag-drop so the card jumps immediately; if the PATCH fails we refetch.
- **No drag library** — native HTML5 drag & drop keeps bundle small.
- **display_order** field is stored but not yet used for reordering within a column (only cross-column moves). Adding intra-column reorder is a future enhancement.
- **Notes**: 4,000 char cap. If we need rich formatting (bold, links) later, swap Textarea for TipTap.

## Future enhancements
- Search/filter (by provider, status, result, month)
- Bulk actions (move multiple cards)
- Timeline / calendar view of deadlines
- Export to CSV
- Reminder integration — automatically flag cards where the linked `saved_scholarship` deadline is inside the reminder window
- Kanban swim-lanes (e.g. by degree level, by country)
- Analytics: acceptance rate, submission velocity, avg days from Saved → Submitted
