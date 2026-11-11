# EventPass

A campus event application built with React, Express, and MongoDB. Students discover events and receive signed QR entry passes; organisers publish events, check attendees in, and export attendance records.

## Features

- Search events by name or venue and filter upcoming/past events.
- Student accounts, profile photos, and persistent sign-in.
- Event creation and editing, capacity limits, and Cloudinary poster uploads.
- Downloadable QR passes and admin-only check-in with duplicate-scan rejection.
- Registration lists, attendance totals, CSV exports, and in-app notifications.
- Responsive layouts, light/dark themes, and loading/error/empty states.

## Run locally

Use Node.js 22 LTS or newer and a running MongoDB instance. Run each service from its own folder so dotenv loads the correct file.

```bash
cd backend
npm install
cp .env.example .env  # Only for a new checkout; keep your existing .env otherwise.
npm start
```

In another terminal:

```bash
cd Frontend
npm install
cp .env.example .env  # Only for a new checkout.
npm run client
```

Open http://localhost:5173. The API uses port 5001 to avoid the macOS port 5000 conflict. If changing the port, update both backend `PORT` and frontend `VITE_API_URL`, then restart both services.

## Configuration

`backend/.env`:

| Variable                                                               | Purpose                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `MONGO_URL`                                                            | Local default: `mongodb://127.0.0.1:27017/college_event_pass`  |
| `JWT_SECRET`                                                           | A long random secret used for sessions and QR signatures       |
| `PORT`                                                                 | API port; default `5001`                                       |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Your Cloudinary credentials; required for image uploads        |
| `EMAIL_ENABLED`                                                        | `false` for local development; `true` to enable Gmail delivery |
| `EMAIL_USER`, `EMAIL_PASS`                                             | Sender Gmail account and its Google app password               |

`Frontend/.env` contains only `VITE_API_URL=http://localhost:5001`. Never put secrets in frontend environment variables. Environment files and uploaded files are excluded from Git.

Email is optional. With it disabled, registration, QR passes, and in-app notifications still work. Restart the backend after changing credentials. Rotating `JWT_SECRET` invalidates existing sessions and previously issued QR passes.

## Account roles

- Students can browse and register for events published by any organiser and download their own passes.
- Admins (organisers) create and manage their own events, attendee lists, exports, and check-ins. They cannot register for entry passes.
- Multiple organiser accounts are supported. Each organiser sees only their own events in the management overview; the public calendar shows every organiser’s events.

## Organiser access

Choose **Admin** on the Create account page to register as an organiser. Admins do not need a roll number and go directly to the event overview after signup. Choose **Student** to register for events and collect passes.

To promote an existing account instead, run:

```bash
cd backend
npm run create-admin -- your-email@example.com
```

After using the command, sign out and sign in again. Public admin signup is enabled for this project; anyone who chooses Admin receives organiser access.

## Architecture

- `Frontend/src/pages`: event discovery, authentication, passes, and organiser screens.
- `Frontend/src/context/AuthContext.jsx`: sign-in state and API authentication.
- `Frontend/src/utils/api.js`: shared API base URL.
- `backend/routes`: authentication, events, registrations, and QR verification.
- `backend/models`: users, events, registrations, and notifications.
- `backend/services/eventCleanup.js`: event status updates and expiry cleanup.

Passwords are hashed with bcrypt. Signed JWTs identify sessions and QR passes. Express middleware checks admin access for event management, check-in, attendee lists, and exports. MongoDB has a unique student/event registration index.

The existing cleanup job marks past events completed and deletes events and registrations seven days after an event. This is a demo retention policy; change it before using the project for long-term attendance records.

## Validation

```bash
cd Frontend
npm run build
npm run lint
```

The API smoke test uses an isolated temporary MongoDB database and cleans it up. It covers signup, admin restrictions, event creation, registration, profile editing, QR check-in, duplicate rejection, and CSV export:

```bash
cd backend
npm test
```

For a manual demo: create student and organiser accounts, publish an event, register as the student, download the QR pass, then scan it as the organiser. Camera scanning needs localhost or HTTPS and browser camera permission. Cloudinary upload and Gmail delivery require valid account credentials.

##Created By : Bedanand Kumar Sah
