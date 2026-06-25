# PalmPay Wallet

A biometric-secured digital wallet application. Users authenticate transactions with a palm scan, manage a virtual wallet, add bank accounts and virtual cards, send and receive funds, and receive real-time notifications.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Environment Variables](#environment-variables)
6. [Installation](#installation)
7. [Running the Application](#running-the-application)
8. [Service Details](#service-details)
   - [Frontend](#frontend)
   - [Node.js Backend](#nodejs-backend)
   - [Palm Auth Service](#palm-auth-service)
9. [API Reference](#api-reference)
10. [Database Models](#database-models)
11. [Real-Time Events](#real-time-events)
12. [Authentication Flow](#authentication-flow)

---

## Architecture Overview

The system is composed of three independent services that run concurrently.

```
┌───────────────────────────────────────────────────────────────────┐
│                          Browser Client                           │
│                    React + Vite (port 5173)                       │
└───────────────────────┬───────────────────────────────────────────┘
                        │ HTTP / WebSocket
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Node.js API Server                            │
│               Express + Socket.IO (port 5000)                     │
│                                                                   │
│  Routes: /api/users  /api/palm  /api/transactions                 │
│          /api/wallet  /api/notifications                          │
└───────────────┬───────────────────────────────────────────────────┘
                │ HTTP (multipart/form-data)
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Palm Auth Microservice                         │
│               FastAPI + PyTorch (port 8000)                       │
│                                                                   │
│  Routes: POST /enroll/{user_id}                                   │
│          POST /verify/{user_id}                                   │
│          DELETE /unenroll/{user_id}                               │
└───────────────┬───────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                       MongoDB Atlas                               │
│                                                                   │
│  Collections: users  wallets  transactions  bank_accounts         │
│               cards  notifications  palm_embeddings               │
└───────────────────────────────────────────────────────────────────┘
```

**Clerk** handles user identity and session management. The Node.js backend verifies every protected request using the Clerk SDK. The Palm Auth service stores biometric embeddings separately in the same MongoDB cluster.

---

## Project Structure

```
palmpay-wallet/
│
├── package.json                  # Root scripts — runs all three services with concurrently
│
├── frontend/                     # React application (Vite)
│   ├── .env.example
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # Application entry point, Clerk provider
│       ├── app/                  # Router definition
│       ├── pages/                # Route-level components
│       │   ├── Dashboard.jsx
│       │   ├── Send.jsx
│       │   ├── Receive.jsx
│       │   ├── Wallet.jsx
│       │   ├── Transactions.jsx
│       │   ├── Analytics.jsx
│       │   ├── Notifications.jsx
│       │   ├── Security.jsx
│       │   ├── Settings.jsx
│       │   ├── AddCard.jsx
│       │   ├── AddMoney.jsx
│       │   ├── Login.jsx
│       │   └── SignUp.jsx
│       ├── components/           # Shared UI components
│       ├── features/             # Feature-specific logic
│       ├── api/                  # Axios API client wrappers
│       ├── store/                # Zustand global state
│       ├── realtime/             # Socket.IO client setup
│       ├── layouts/              # Page layout wrappers
│       └── constants/            # Application-wide constants
│
├── backend/                      # Node.js API server
│   ├── .env.example
│   ├── index.js                  # Server entry point
│   ├── middleware/
│   │   ├── authMiddleware.js     # Clerk JWT verification
│   │   └── upload.js             # Multer file upload config
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── palmRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── walletRoutes.js
│   │   └── notificationRoutes.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── palmController.js
│   │   ├── transactionController.js
│   │   ├── walletController.js
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Wallet.js
│   │   ├── Transaction.js
│   │   ├── BankAccount.js
│   │   ├── Card.js
│   │   └── Notification.js
│   ├── realtime/
│   │   ├── socketServer.js       # Socket.IO server initialization
│   │   ├── socketAuth.js         # Socket authentication middleware
│   │   ├── socketRooms.js        # Room name helpers
│   │   ├── eventNames.js         # Shared event name constants
│   │   ├── io.js                 # Shared io instance
│   │   ├── emitters/             # Per-event emit helpers
│   │   └── utils/
│   └── scripts/                  # One-off utility scripts
│
└── backend/palm_auth/            # Python biometric microservice
    ├── main.py                   # FastAPI application
    ├── requirements.txt
    ├── palm_config.json          # Model inference configuration
    ├── palm_embedder_scripted.pt # TorchScript embedding model
    └── best_palm_model.pt        # Trained palm classification model
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| UI / Styling | Tailwind CSS v4, Shadcn/ui, Framer Motion |
| State management | Zustand |
| Server-state / caching | TanStack Query v5 |
| Authentication | Clerk |

| Real-time communication | Socket.IO |
| API client | Axios |
| QR code | html5-qrcode, qrcode.react |
| Charts | Recharts |
| PDF export | jsPDF + jspdf-autotable |
| Node.js runtime | Express 5 + Socket.IO 4 |
| Database | MongoDB Atlas (Mongoose 9) |
| Auth middleware | @clerk/clerk-sdk-node |
| File uploads | Multer |
| Biometric service | FastAPI + Uvicorn |
| ML inference | PyTorch (TorchScript) |
| Image processing | Pillow, torchvision |
| Package manager | pnpm |

---

## Prerequisites

- **Node.js** v18 or later
- **pnpm** v10 — `npm install -g pnpm`
- **Python** 3.10 or later
- **MongoDB Atlas** account with a cluster and database user
- **Clerk** account with an application configured
- **Stripe** account with test mode enabled

---

## Environment Variables

Each service has its own `.env` file. Example files are provided. Copy each one and fill in the real values.

### Backend (`backend/.env`)

```
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on. Default: `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PALM_AUTH_URL` | Base URL of the Palm Auth microservice. Default: `http://localhost:8000` |
| `CLERK_SECRET_KEY` | Clerk secret key — used to verify session tokens server-side |

### Frontend (`frontend/.env`)

```
cp frontend/.env.example frontend/.env
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key — loaded in the browser |

> **Note:** Never place secret keys in frontend environment variables. Only publishable keys that are safe to expose belong in the frontend `.env`.

---

## Installation

### 1. Install root dependencies

```bash
pnpm install
```

### 2. Install backend dependencies

```bash
cd backend
pnpm install
cd ..
```

### 3. Install frontend dependencies

```bash
cd frontend
pnpm install
cd ..
```

### 4. Set up the Python virtual environment

```bash
cd backend/palm_auth
python -m venv venv
```

Activate the virtual environment:

- **Windows:** `venv\Scripts\activate`
- **macOS / Linux:** `source venv/bin/activate`

Install Python dependencies:

```bash
pip install -r requirements.txt
```

```bash
cd ../..
```

---

## Running the Application

### All services at once (recommended)

From the project root, run all three services concurrently:

```bash
pnpm run dev
```

This executes the following three commands in parallel:

| Service | Command | URL |
|---|---|---|
| Frontend | `pnpm run dev --host` (in `frontend/`) | http://localhost:5173 |
| Node.js backend | `pnpm run dev` (in `backend/`) | http://localhost:5000 |
| Palm Auth service | `python main.py` (in `backend/palm_auth/`) | http://localhost:8000 |

### Running services individually

**Frontend:**
```bash
cd frontend
pnpm run dev --host
```

**Node.js backend:**
```bash
cd backend
pnpm run dev
```

**Palm Auth microservice** (activate the virtual environment first):
```bash
cd backend/palm_auth
venv\Scripts\activate        # Windows
python main.py
```

---

## Service Details

### Frontend

The frontend is a single-page application built with React and Vite. It uses React Router v7 for client-side routing and Clerk for authentication UI components.

**Key pages:**

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Wallet balance summary and swipeable asset carousel |
| `/send` | Send | Palm-verified fund transfer to another user |
| `/receive` | Receive | QR code generation for receiving funds |
| `/wallet` | Wallet | Linked bank accounts and virtual card management |
| `/transactions` | Transactions | Full transaction history with PDF export |
| `/analytics` | Analytics | Spending charts and category breakdown |
| `/notifications` | Notifications | Real-time notification feed |
| `/security` | Security | Palm biometric enrollment and removal |
| `/settings` | Settings | Profile, phone number, and preference settings |
| `/add-card` | AddCard | Virtual card issuance via biometric authorization |
| `/add-money` | AddMoney | Add funds to the wallet |

The Zustand store manages global client state. TanStack Query handles all server-state caching and background refetching. Socket.IO client connects to the backend and receives real-time notifications.

### Node.js Backend

The backend is an Express 5 server with Socket.IO attached to the same HTTP server instance. It connects to MongoDB Atlas using Mongoose.

**Middleware:**

- `requireAuth` — Verifies the Clerk Bearer token on every protected route. Attaches the decoded payload to `req.auth`.
- `upload` — Multer middleware used by palm routes to accept image file uploads.

**Protected route groups:**

| Prefix | Auth required |
|---|---|
| `/api/users` | No |
| `/api/palm` | No (auth handled internally per endpoint) |
| `/api/transactions` | Yes |
| `/api/wallet` | Yes |
| `/api/notifications` | Yes |

Socket.IO connections are also authenticated. The `socketAuthMiddleware` in `realtime/socketAuth.js` validates the Clerk token sent during the socket handshake and attaches `clerkId` to `socket.data`. Each connected user is placed into a private room identified by their Clerk user ID.

### Palm Auth Service

The Palm Auth service is a FastAPI application that handles biometric enrollment and verification. It loads a TorchScript model (`palm_embedder_scripted.pt`) to generate 128-dimensional palm embeddings from uploaded images. Embeddings are stored in the `palm_embeddings` collection in MongoDB Atlas.

**Inference configuration** (`palm_config.json`):

| Key | Default | Description |
|---|---|---|
| `threshold` | `0.82` | Minimum cosine similarity to accept a verification attempt |
| `embed_dim` | `128` | Output dimension of the embedding model |
| `img_size` | `128` | Input image size (pixels) |
| `normalize.mean` | `[0.5]` | Normalization mean for grayscale input |
| `normalize.std` | `[0.5]` | Normalization standard deviation |
| `eer_percent` | `1.52` | Equal error rate achieved during training |

The service accepts a single palm image per enrollment call and replaces any existing embedding for that user. Verification computes the cosine similarity between the probe embedding and the stored embedding and returns `accepted: true` if the similarity meets or exceeds the threshold.

---

## API Reference

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/sync` | No | Create or update a user record from Clerk data |
| GET | `/api/users/:clerkId` | No | Retrieve a user profile by Clerk ID |

### Palm Biometrics — `/api/palm`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/palm/enroll` | Clerk token | Upload a palm image and store the embedding |
| POST | `/api/palm/verify` | Clerk token | Verify a palm image against the stored embedding |
| DELETE | `/api/palm/unenroll` | Clerk token | Remove all palm data for the authenticated user |
| GET | `/api/palm/status` | Clerk token | Check whether the user has an enrolled palm |

### Transactions — `/api/transactions`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/transactions` | Yes | Create a new transaction (requires palm verification) |
| GET | `/api/transactions` | Yes | List all transactions for the authenticated user |
| GET | `/api/transactions/:id` | Yes | Get a single transaction by ID |

### Wallet — `/api/wallet`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wallet` | Yes | Get the wallet balance and details |
| POST | `/api/wallet/add-money` | Yes | Add funds to the wallet balance |
| GET | `/api/wallet/bank-accounts` | Yes | List linked bank accounts |
| POST | `/api/wallet/bank-accounts` | Yes | Link a new bank account |
| DELETE | `/api/wallet/bank-accounts/:id` | Yes | Remove a linked bank account |
| GET | `/api/wallet/cards` | Yes | List virtual cards |
| POST | `/api/wallet/cards` | Yes | Issue a new virtual card |
| DELETE | `/api/wallet/cards/:id` | Yes | Remove a virtual card |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | List all notifications for the authenticated user |
| PATCH | `/api/notifications/:id/read` | Yes | Mark a notification as read |
| PATCH | `/api/notifications/read-all` | Yes | Mark all notifications as read |

### Palm Auth Microservice — direct (port 8000)

These endpoints are called by the Node.js backend, not directly by the browser.

| Method | Path | Description |
|---|---|---|
| POST | `/enroll/{user_id}` | Enroll a palm embedding for a user |
| POST | `/verify/{user_id}` | Verify a palm image against the stored embedding |
| DELETE | `/unenroll/{user_id}` | Remove all palm data for a user |
| GET | `/config` | Return the current inference configuration |

---

## Database Models

### User

| Field | Type | Description |
|---|---|---|
| `clerkId` | String | Primary identifier from Clerk |
| `email` | String | User email address |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `phone` | String | Phone number |
| `imageUrl` | String | Profile image URL |

### Wallet

| Field | Type | Description |
|---|---|---|
| `userId` | String | Reference to User `clerkId` |
| `balance` | Number | Current balance in the default currency |

### Transaction

| Field | Type | Description |
|---|---|---|
| `senderId` | String | Clerk ID of the sender |
| `receiverId` | String | Clerk ID of the receiver |
| `amount` | Number | Transaction amount |
| `type` | String | `send`, `receive`, or `topup` |
| `status` | String | `pending`, `completed`, or `failed` |
| `note` | String | Optional transaction note |
| `createdAt` | Date | Timestamp |

### BankAccount

| Field | Type | Description |
|---|---|---|
| `userId` | String | Reference to User `clerkId` |
| `bankName` | String | Name of the bank |
| `accountNumber` | String | Account number |
| `accountType` | String | Account type |

### Card

| Field | Type | Description |
|---|---|---|
| `userId` | String | Reference to User `clerkId` |
| `cardNumber` | String | Masked card number |
| `cardHolder` | String | Cardholder name |
| `expiryDate` | String | Expiry in MM/YY format |
| `type` | String | `virtual` |

### Notification

| Field | Type | Description |
|---|---|---|
| `userId` | String | Reference to User `clerkId` |
| `title` | String | Notification title |
| `message` | String | Notification body |
| `type` | String | Notification category |
| `read` | Boolean | Whether the user has read the notification |
| `createdAt` | Date | Timestamp |

---

## Real-Time Events

The backend emits Socket.IO events to user-specific rooms. The room name for a user is derived from their Clerk ID. The frontend subscribes to these events on connection.

| Event name | Payload | Description |
|---|---|---|
| `emitNotificationNew` | Notification object | A new notification has been created for the user |
| `emitBalanceUpdate` | `{ balance }` | The user's wallet balance has changed |
| `emitTransactionNew` | Transaction object | A new transaction has been recorded for the user |

Event name constants are defined in `backend/realtime/eventNames.js` and imported wherever events are emitted or consumed to prevent typos.

---

## Authentication Flow

1. The user signs in through the Clerk-hosted UI rendered in the React app.
2. Clerk issues a short-lived JWT session token stored client-side.
3. The React app attaches the token as a `Bearer` header on every API request via Axios.
4. The `requireAuth` middleware on the Express server calls `clerkClient.verifyToken(token)` to validate the JWT.
5. On success, `req.auth` is populated with the decoded payload (includes `sub`, which is the Clerk user ID).
6. For WebSocket connections, the same token is sent in the handshake `auth` object and validated by `socketAuthMiddleware` before the connection is accepted.
7. For palm-verified actions (e.g., sending funds), the frontend captures a palm image and sends it to the backend, which forwards it to the Palm Auth microservice. The transaction proceeds only if `accepted: true` is returned.
