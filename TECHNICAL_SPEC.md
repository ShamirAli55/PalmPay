# 📊 PalmPay Technical Specification Document

This document provides a line-by-line understanding of the PalmPay architecture for the implementation phase of the FYP report.

---

## 🏗️ 1. Backend Infrastructure (Node.js/Express)

### A. Real-time Service (`backend/realtime/`)
- **`socketServer.js`**: Initializes the Socket.IO instance with CORS policies. It utilizes `socketAuth.middleware` to secure the connection at the protocol level.
- **`socketAuth.js`**: Connects to the @clerk/clerk-sdk-node to verify incoming JWTs. It extracts the `clerkId` (sub) and attaches it to the socket instance for room identification.
- **`io.js`**: A module exported to provide access to the IO instance without circular dependencies.
- **`emitters/`**: 
  - `walletEmitter.js`: Dispatches balance updates.
  - `notificationEmitter.js`: Handles real-time push of notification objects.
  - `transactionEmitter.js`: Handles immediate streaming of transaction ledger entries.

### B. Controller Logic (`backend/controllers/`)
- **`transactionController.js`**: The core "engine". 
  - Uses `mongoose.startSession()` for ACID compliance.
  - Interacts with the Python service for biometric validation.
  - Implements "Double Entry" logic (creating both a debit for the sender and a credit for the receiver).

---

## 🖥️ 2. Frontend Infrastructure (React/Vite)

### A. State Management (Zustand)
We use a decoupled store pattern to prevent unnecessary re-renders:
- **`walletStore.js`**: Contains the `balance`, `transactions[]`, and `notifications[]`. It includes methods like `applyBalanceUpdatedEvent` which allow external socket listeners to mutate state authoritatively.
- **`realtimeStore.js`**: A specialized store that tracks `isConnected` and `syncRequired`. It implements an **Idempotency Map** (`processedEventIds`) to ensure that in multi-tab scenarios, an event is only processed once.

### B. Real-time Listeners (`frontend/src/realtime/`)
- **`socket.js`**: Singleton client that handles reconnections and token injection.
- **`SocketManager.jsx`**: A "Headless Component" that sits at the root of the React tree (`main.jsx`). It watches the Clerk authentication state and triggers `socketManager.connect()` only after the user is signed in.

---

## 🐍 3. Biometric Service (Python/FastAPI)

Located in `backend/palm_auth/`, this service performs:
- **Feature Extraction**: Converting palm images into mathematical embeddings.
- **Verification**: Comparing live captures against a pre-registered "Seed" image for the user.

---

## 🔄 4. Data Flow: "The Real-time Loop"

1.  **Client** calls `POST /api/transactions/create` with a palm image.
2.  **API Gateway** verifies Palm and Clerk JWT.
3.  **API Gateway** executes a **MongoDB Transaction**:
    - Debit Sender
    - Credit Receiver
    - Commit.
4.  **Backend** triggers `emitter.emitWalletBalanceUpdated()` for both parties.
5.  **Socket Server** routes messages to rooms `user:{senderId}` and `user:{receiverId}`.
6.  **Receiver Client** receives `WALLET_BALANCE_UPDATED` event.
7.  **Zustand** updates the balance and triggers a **React Re-render** of the Dashboard.

---

## 📂 5. Project Manifest (Key Files)

| File | Responsibility |
| :--- | :--- |
| `backend/index.js` | Server bootstrap, HTTP wrapping, Socket init |
| `backend/realtime/socketRooms.js` | Canonical room naming logic |
| `frontend/src/realtime/listeners` | Mapping socket events to UI state mutations |
| `frontend/src/store/walletStore.js` | Single Source of Truth (SSOT) for the UI |
| `backend/controllers/notificationController.js` | Logic for read-state synchronization |
