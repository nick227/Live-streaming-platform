# Admin Operations Spec

## Admin goal

Admins need enough control to understand and manage the site day to day.

## Core admin questions

- Who is live?
- Who is making money?
- Are payments working?
- Are rooms behaving?
- Are users or creators causing problems?
- What needs review today?

## Admin pages

### /admin

Overview metrics:
- Live rooms now.
- Active viewers.
- Creators live.
- Tokens purchased today.
- Tokens tipped today.
- Active private sessions.
- Pending media reviews.
- Payment failures.
- Open reports.

### /admin/rooms

Actions:
- Open room detail.
- End room.
- Hide from browse.
- Disable private requests.

### /admin/rooms/:id

Shows:
- Creator.
- Room status.
- Viewer timeline.
- Chat log.
- Tips.
- Private requests.
- Reports.
- Thumbnail.
- Event log.

Actions:
- End room.
- Hide room.
- Delete message.
- Mute/kick user.
- Suspend creator.
- Disable thumbnail.

### /admin/users

Actions:
- Suspend user.
- View wallet.
- View payments.
- View chat history.
- Adjust wallet.

### /admin/creators

Actions:
- Approve/pause/suspend creator.
- Disable private sessions.
- Disable thumbnails.
- View rooms/earnings.

### /admin/payments

Actions:
- View raw provider payload.
- Confirm tokens credited.
- Mark manual review.
- Reverse credited tokens for refund/chargeback.
- Export CSV.

### /admin/wallets

Rules:
- Never edit ledger rows.
- Only append admin adjustments.

### /admin/private-sessions

Actions:
- View active sessions.
- Force end.
- Review token captures/releases.

### /admin/media-review

Actions:
- Approve.
- Reject.
- Hide.
- Flag creator.

### /admin/reports

Actions:
- Review.
- Resolve.
- Dismiss.
- Escalate.

## Required admin actions from day one

- End public room.
- Force end private session.
- Hide room from browse.
- Delete chat message.
- Mute/kick user.
- Suspend user.
- Suspend creator.
- Approve/reject/hide media.
- View payment transaction.
- View wallet ledger.
- Create wallet adjustment.
- Resolve report.

## Audit requirements

Every admin action should create an AdminAction record with:
- admin user.
- target entity.
- action type.
- reason.
- timestamp.
- metadata.
