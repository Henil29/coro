# Coro

Full-stack collaborative project workspace with real-time messaging, project/user management, and integrated AI assistance (Gemini) for generating development help and code snippets. Built with a MERN-style backend (Express + MongoDB) and a modern React (Vite) frontend. Socket.IO powers real-time project rooms; Google Generative AI (Gemini) provides contextual responses when users mention `@ai` inside a project chat.

## Features
- User registration, login, logout with JWT + httpOnly cookie storage
- Password strength validation & secure hashing (bcrypt)
- Project creation, listing, sharing (add users by ID/email)
- Real-time project room messaging via Socket.IO
- Inline AI assistance: prepend messages with `@ai` to get generated responses
- AI endpoint for programmatic prompt/result retrieval
- Modular service/controller architecture and request validation (express-validator)
- Centralized DB connection handling

## Tech Stack
**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, bcrypt, dotenv, express-validator, morgan, cors

**Frontend:** React (Vite), React Router, Axios, Socket.IO Client, Tailwind (via Vite plugin), Monaco Editor, Markdown rendering, WebContainers API

**AI:** Google Generative AI (Gemini) via `@google/generative-ai`

## Architecture Overview
- REST API under `/api/*` for user, project, and AI operations
- Socket.IO server attached to HTTP server for real-time events
- Authorization for Socket.IO connections via JWT (token passed in `auth` payload)
- AI messages triggered in the room when a chat message contains `@ai`

## Folder Structure (Top Level)
```
backend/
  app.js            # Express app setup & route mounting
  server.js         # HTTP + Socket.IO server bootstrap
  db/db.js          # Mongo connection helper
  controllers/      # Request handlers
  services/         # Business & integration logic (AI, project)
  models/           # Mongoose schemas
  routes/           # Route definitions (user, project, ai)
  middlewares/      # Auth & validation middleware
frontend/
  src/
    App.jsx
    main.jsx
    config/         # axios, socket, webContainers config
    context/        # React context (user)
    screens/        # Pages (Home, Login, Register, Project)
    components/     # Shared UI (Navbar)
    auth/           # Auth-related UI components
```

## Backend Setup
```powershell
# From repo root
cd backend
npm install
```
Create a `.env` file in `backend/`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/coro
JWT_SECRET=replace_with_strong_secret
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
```
Run the server (nodemon start script):
```powershell
npm start
```
The backend will listen on `http://localhost:5000`.

## Frontend Setup
```powershell
cd frontend
npm install
```
Create `.env` (Vite uses `VITE_` prefix):
```
VITE_API_URL=http://localhost:5000/api
```
Start dev server:
```powershell
npm run dev
```
Frontend typically runs on `http://localhost:5173` (Vite default).

## Environment Variables Summary
| Variable | Location | Description |
|----------|----------|-------------|
| PORT | backend | Port for Express/Socket.IO server |
| MONGO_URI | backend | MongoDB connection string |
| JWT_SECRET | backend | Secret for signing JWT tokens |
| GEMINI_API_KEY | backend | API key for Google Gemini model |
| NODE_ENV | backend | Environment mode (affects cookie security) |
| VITE_API_URL | frontend | Base URL for Axios & Socket (adjusted for Socket.IO) |

## NPM Scripts
Backend:
- `npm start` – runs `nodemon server.js`

Frontend:
- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview built assets
- `npm run lint` – run ESLint

## API Endpoints
Base URL: `http://localhost:5000/api`

### User (`/api/user`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new user (name, email, password) |
| POST | `/login` | No | Login (email, password) returns JWT + cookie |
| GET  | `/logout` | Yes (cookie) | Clear auth cookie |
| GET  | `/` | Yes | Get logged-in user info |
| GET  | `/all` | Yes | List other users (excluding logged-in user) |

### Project (`/api/project`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create` | Yes | Create project (name) |
| GET  | `/all` | Yes | Get all projects for logged-in user |
| PUT  | `/add-user` | Yes | Add users to a project (`projectId`, `users` array) |
| GET  | `/get-project/:projectId` | Yes | Get single project by ID |

### AI (`/api/ai`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/get-result?prompt=...` | Optional* | Generate AI response (returns text). *Currently no explicit auth middleware; secure behind auth if needed. |

## Real-Time Messaging
- Socket.IO endpoint shares same origin/port as backend.
- Client initializes socket in `frontend/src/config/socket.js` using `VITE_API_URL` (the code strips trailing `/api`).
- Connection Auth: JWT token passed in `auth.token`.
- Query Param: `projectId` required and validated server-side.
- Emit event: `project-message` with `{ message, sender }` object.
- To trigger AI assistant: Include `@ai` anywhere in the message; server replaces with generated result and broadcasts from pseudo-user `AI Assistant`.

## Authentication Flow
1. Register/Login returns a JWT and sets `token` httpOnly cookie.
2. Frontend also stores JWT in `localStorage` for Socket.IO & Axios `Authorization: Bearer <token>` header.
3. Protected routes use `isAuth` middleware to validate token and attach user.

## Validation & Error Handling
- `express-validator` enforces shape for project creation & modification.
- Centralized try/catch blocks in controllers return structured error messages.
- AI service gracefully degrades with overloaded message fallback.

## Development Workflow Tips
- Keep `VITE_API_URL` aligned with backend `/api` prefix.
- When modifying socket auth, ensure token & projectId logic stays in sync.
- Add rate limiting or caching (Redis dependency already included) for scaling.
- Wrap AI responses with additional metadata if future clients need structured JSON.

## Extending
Ideas:
- Add role-based project permissions (owner/admin/member)
- Persist chat history in Mongo (currently transient unless stored in project model)
- Integrate Redis for session / pub-sub scaling
- Add unit tests (Jest for backend, React Testing Library for frontend)
- Implement refresh tokens & token rotation

## Security Considerations
- Use HTTPS + secure cookies in production (`NODE_ENV=production` sets `secure` cookie flag)
- Sanitize user inputs & consider content filtering for AI prompts
- Store secrets outside source control (never commit `.env`)

## Contributing
1. Fork & clone
2. Create feature branch: `git checkout -b feature/awesome`
3. Commit changes: `git commit -m "feat: add awesome"`
4. Push & open PR

## License
Backend specifies ISC license. Consider adding explicit LICENSE file if needed.

## Quick Start (All In One)
```powershell
# From project root
# Backend
cd backend; npm install; echo "PORT=5000`nMONGO_URI=mongodb://localhost:27017/coro`nJWT_SECRET=dev_secret`nGEMINI_API_KEY=your_key`nNODE_ENV=development" > .env; npm start
# In a new terminal (frontend)
cd ../frontend; npm install; echo "VITE_API_URL=http://localhost:5000/api" > .env; npm run dev
```

---
Feel free to open issues for bugs or enhancement requests.
