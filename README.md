# DevPulse API

A backend REST API for tracking bugs and feature requests within a software team. Built this as part of my assignment to learn Node.js, Express and PostgreSQL properly.

---

## Live URL

```
https://devpulse-assignment.vercel.app/
```

---

## What it does

Basically its a issue tracker where team members can sign up, log in and create bug reports or feature requests. There are two types of users — contributors who can create and view issues, and maintainers who have full control over everything including deleting issues and changing statuses.

I spent quite a bit of time figuring out the JWT auth flow and how bcrypt hashing works. Also the part where you have to fetch reporter details without using SQL JOINs was a bit tricky at first but I got it working using a batch query with `ANY($1::int[])`.

---

## Tech Stack

- **Node.js** (USED v24 LTS)
- **TypeScript** (strict mode, no any types)
- **Express.js** (modular router setup)
- **PostgreSQL** via NeonDB (free hosted postgres)
- **pg** driver — raw SQL only, no ORM
- **bcrypt** — password hashing with salt rounds of 10
- **jsonwebtoken** — for generating and verifying JWT tokens
- **dotenv** — environment variable management
- **http-status-codes** — cleaner status code references

---

## Setup — Run Locally

**1. Clone the repo**

```bash
git clone https://github.com/mkhaque1/Assignment-2-nodejs-express.git
cd Assignment-2-nodejs-express
```

**2. Install dependencies**

```bash
npm install
```

**3. Create a `.env` file in the root**

```
PORT=3000
DATABASE_URL=your_neondb_connection_string_here
JWT_SECRET=your_secret_key_here
```

**4. Start the dev server**

```bash
npm run dev
```

The server will auto-create the database tables on first startup. You should see:

```
✅ Database connected successfully
✅ Users table ready
✅ Issues table ready
✅ Server running on http://localhost:3000
```

---

## Database Schema

### users

| Column     | Type         | Notes                                              |
| ---------- | ------------ | -------------------------------------------------- |
| id         | SERIAL       | primary key, auto increment                        |
| name       | VARCHAR(255) | required                                           |
| email      | VARCHAR(255) | required, unique                                   |
| password   | VARCHAR(255) | bcrypt hashed, never returned in responses         |
| role       | VARCHAR(20)  | contributor or maintainer, defaults to contributor |
| created_at | TIMESTAMP    | auto set on insert                                 |
| updated_at | TIMESTAMP    | auto updated on update                             |

### issues

| Column      | Type         | Notes                                          |
| ----------- | ------------ | ---------------------------------------------- |
| id          | SERIAL       | primary key, auto increment                    |
| title       | VARCHAR(150) | required, max 150 chars                        |
| description | TEXT         | required, min 20 chars                         |
| type        | VARCHAR(20)  | bug or feature_request                         |
| status      | VARCHAR(20)  | open, in_progress, resolved — defaults to open |
| reporter_id | INTEGER      | id of user who created it                      |
| created_at  | TIMESTAMP    | auto set on insert                             |
| updated_at  | TIMESTAMP    | auto updated on update                         |

---

## API Endpoints

### Auth

| Method | Endpoint           | Access | Description             |
| ------ | ------------------ | ------ | ----------------------- |
| POST   | `/api/auth/signup` | Public | Register new user       |
| POST   | `/api/auth/login`  | Public | Login and get JWT token |

### Issues

| Method | Endpoint          | Access          | Description                       |
| ------ | ----------------- | --------------- | --------------------------------- |
| POST   | `/api/issues`     | Authenticated   | Create new issue                  |
| GET    | `/api/issues`     | Public          | Get all issues (supports filters) |
| GET    | `/api/issues/:id` | Public          | Get single issue                  |
| PATCH  | `/api/issues/:id` | Authenticated   | Update issue                      |
| DELETE | `/api/issues/:id` | Maintainer only | Delete issue                      |

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": "optional extra detail"
}
```

| Status | When it happens                             |
| ------ | ------------------------------------------- |
| 400    | Missing fields, validation failed           |
| 401    | No token or invalid/expired token           |
| 403    | Valid token but wrong role                  |
| 404    | Issue or user not found                     |
| 409    | Contributor trying to edit a non-open issue |
| 500    | Something unexpected on the server          |

---

## Deployment

- **Backend:** Vercel
- **Database:** NeonDB (PostgreSQL)
- Environment variables are set in the Vercel dashboard under Settings → Environment Variables

---

## Scripts

```bash
npm run dev      # start dev server with hot reload
npm run build    # compile TypeScript to JavaScript
npm start        # run compiled version (used by Vercel)
```
