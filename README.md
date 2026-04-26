# Basic Node.js Backend

A clean, modular, and professional Node.js backend starter project using Express.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - The project includes a `.env` file with default settings.
   - You can modify the `PORT` or `NODE_ENV` as needed.

### Running the Server

- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

## 📂 Project Structure

```text
├── src/ 
  ├── controllers/      # Route controllers (logic)
  ├── routes/           # API route definitions
├── .env              # Environment variables
├── app.js            # Express app configuration
├── index.js          # Entry point
└── package.json      # Dependencies and scripts
```

## 🛠️ API Endpoints

- **Health Check**: `GET /api/health` - Verifies the server status.

## 📝 License
ISC
