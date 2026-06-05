# Financial Management API Documentation

This document outlines the RESTful API endpoints available in the backend of the Financial Management application. The API is built using Fastify and Zod for validation. All protected endpoints require a Bearer token in the `Authorization` header.

## Base URL
`http://localhost:5000/api` (or equivalent production domain)

---

## 1. Authentication (`/auth`)

### 1.1 Register
- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user account.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "jwt_token...",
    "refreshToken": "refresh_token...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "authProvider": "local"
    }
  }
  ```

### 1.2 Login
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate user and get tokens.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** Same as Register.

### 1.3 Google Login
- **Endpoint:** `POST /auth/google`
- **Description:** Sync/Authenticate user using a token from Google (or Clerk).
- **Request Body:**
  ```json
  {
    "token": "google_token_here"
  }
  ```
- **Response:** Same as Register.

### 1.4 Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Description:** Obtain a new access token using a refresh token.
- **Request Body:**
  ```json
  {
    "refreshToken": "refresh_token..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "new_jwt_token...",
    "refreshToken": "new_refresh_token..."
  }
  ```

### 1.5 Forgot & Reset Password
- **POST `/auth/forgot-password`**
  - **Request Body:** `{ "email": "user@example.com" }`
- **POST `/auth/reset-password`**
  - **Request Body:** `{ "email": "user@example.com", "otp": "123456", "newPassword": "NewPassword1!" }`

---

## 2. Users (`/users`)
*All endpoints require authentication.*

### 2.1 Get Current User
- **Endpoint:** `GET /users/me`
- **Description:** Returns the currently authenticated user's profile.
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "string | null",
    "authProvider": "local",
    "createdAt": "2024-06-05T00:00:00Z"
  }
  ```

### 2.2 Update Profile
- **Endpoint:** `PATCH /users/me`
- **Request Body (Optional fields):**
  ```json
  {
    "firstName": "Johnny",
    "lastName": "Doe",
    "avatarUrl": "https://..."
  }
  ```

### 2.3 Update Password
- **Endpoint:** `PATCH /users/me/password`
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword1!",
    "newPassword": "NewPassword2!"
  }
  ```

### 2.4 Delete Account
- **Endpoint:** `DELETE /users/me`
- **Description:** Permanently deletes the current user's account and all associated data.

---

## 3. Transactions (`/transactions`)

### 3.1 Get Transactions
- **Endpoint:** `GET /transactions`
- **Query Params:**
  - `page` (number)
  - `limit` (number)
  - `type` ("income" | "expense")
  - `categoryId` (string)
  - `startDate` (string YYYY-MM-DD)
  - `endDate` (string YYYY-MM-DD)
  - `isRecurring` (boolean)
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "amount": 50000,
        "type": "expense",
        "description": "Coffee",
        "date": "2024-06-05T10:00:00Z",
        "categoryId": "uuid",
        "category": { "id": "uuid", "name": "Food", "icon": "🍔" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

### 3.2 Create Transaction
- **Endpoint:** `POST /transactions`
- **Request Body:**
  ```json
  {
    "amount": 50000,
    "type": "expense",
    "date": "2024-06-05T10:00:00Z",
    "description": "Coffee",
    "categoryId": "uuid"
  }
  ```

### 3.3 Manage Single Transaction
- **GET `/transactions/:id`** - Get transaction details.
- **PATCH `/transactions/:id`** - Update transaction (partial fields).
- **DELETE `/transactions/:id`** - Delete transaction.

### 3.4 Auto Categorize (AI)
- **Endpoint:** `POST /transactions/auto-categorize`
- **Request Body:** `{ "description": "Highland coffee" }`
- **Response:** Returns suggested `categoryId`.

---

## 4. Reports (`/reports`)

### 4.1 Report Summary
- **Endpoint:** `GET /reports/summary`
- **Query Params:** `period` (YYYY-MM, optional, defaults to current month)
- **Response:**
  ```json
  {
    "period": "2024-06",
    "totalIncome": 15000000,
    "totalExpense": 8000000,
    "netBalance": 7000000,
    "transactionCount": 25
  }
  ```

### 4.2 Monthly Trend
- **Endpoint:** `GET /reports/monthly-trend`
- **Query Params:** `months` (number, default 6)
- **Response:** Array of objects `{ period, income, expense, net }`

### 4.3 Category Breakdown
- **Endpoint:** `GET /reports/category-breakdown`
- **Query Params:** `period` (YYYY-MM, optional)
- **Response:** Array of objects `{ categoryId, categoryName, type, totalAmount, percentage }`

### 4.4 Cash Flow
- **Endpoint:** `GET /reports/cash-flow`
- **Query Params:** `period` (YYYY-MM)
- **Response:** Array of daily `{ date, income, expense, net }`

---

## 5. Budgets (`/budgets`)

### 5.1 Get Budgets
- **Endpoint:** `GET /budgets`
- **Query Params:** `period` (YYYY-MM)
- **Response:** Array of budget objects.

### 5.2 Budget Summary
- **Endpoint:** `GET /budgets/summary`
- **Query Params:** `period` (YYYY-MM)
- **Response:** `{ totalBudget, totalSpent, remaining }`

### 5.3 Create Budget
- **Endpoint:** `POST /budgets`
- **Request Body:** `{ "categoryId": "uuid", "amount": 2000000, "period": "2024-06" }`

### 5.4 Manage Single Budget
- **PATCH `/budgets/:id`** - Update budget amount.
- **DELETE `/budgets/:id`** - Delete budget.

---

## 6. Goals (`/goals`)

### 6.1 Get Goals
- **Endpoint:** `GET /goals`
- **Response:** Array of goal objects.

### 6.2 Create Goal
- **Endpoint:** `POST /goals`
- **Request Body:**
  ```json
  {
    "name": "Buy a car",
    "targetAmount": 500000000,
    "currentAmount": 0,
    "deadline": "2025-12-31"
  }
  ```

### 6.3 Manage Single Goal
- **PATCH `/goals/:id`** - Update goal details.
- **DELETE `/goals/:id`** - Delete goal.
- **POST `/goals/:id/contribute`** - Add money to goal.
  - **Request Body:** `{ "amount": 5000000 }`

---

## 7. Categories (`/categories`)

### 7.1 Get Categories
- **Endpoint:** `GET /categories`
- **Query Params:** `type` ("income" | "expense", optional)
- **Response:** Array of category objects `{ id, name, type, icon, color }`.

### 7.2 Create Category
- **Endpoint:** `POST /categories`
- **Request Body:** `{ "name": "Salary", "type": "income", "icon": "💵", "color": "#10d9a0" }`

### 7.3 Manage Single Category
- **PATCH `/categories/:id`** - Update category details.
- **DELETE `/categories/:id`** - Delete category.
