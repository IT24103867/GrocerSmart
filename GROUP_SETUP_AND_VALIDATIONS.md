# GrocerSmartAI Group Setup and Backend Validation Guide

This guide is for team members to quickly run the project and understand backend validations by module.

## 1) Project Structure Overview

- `frontend/`: React + Vite UI
- `backend/`: Node.js + Express API + MongoDB
- `ai_features/`: Flask service for credit risk + demand forecasting

## 2) Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+ (recommended for `ai_features`)
- MongoDB connection string

## 3) Initial Setup (First Time)

### 3.1 Clone and install dependencies

```powershell
# from repo root
cd backend
npm install

cd ../frontend
npm install
```

### 3.2 Setup backend environment

Create `backend/.env` with at least:

```env
PORT=8000
DATABASE=<your_mongodb_connection_string>
JWT_SECRET=<strong_secret>
JWT_EXPIRES_IN=7d

# AI service integration
AI_SERVER_URL=http://localhost:5000
AI_CREDIT_RISK_ENDPOINT=/predict/credit
AI_DEMAND_FORECAST_ENDPOINT=/predict/forecast/14days
```

### 3.3 Setup AI service environment

```powershell
# from repo root
cd ai_features
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install flask numpy pandas joblib scikit-learn
```

Notes:
- This repo does not currently include a `requirements.txt` inside `ai_features/`.
- The model files used by `ai_features/app.py` must already exist in:
  - `ai_features/credit_risk_predictor/final_model/credit_ensemble.pkl`
  - `ai_features/demand_forecaster/final_model/demand_pipeline.pkl`

## 4) Running the Project

Use 3 terminals.

### Terminal A: AI service

```powershell
cd ai_features
.\.venv\Scripts\Activate.ps1
python app.py
```

Expected default URL: `http://localhost:5000`

### Terminal B: Backend API

```powershell
cd backend
npm run dev
# or npm start
```

Expected default URL: `http://localhost:8000`

### Terminal C: Frontend

```powershell
cd frontend
npm run dev
```

Expected default URL: `http://localhost:5173`

## 5) Optional Admin Seed

```powershell
cd backend
npm run seed:admin
```

## 6) Backend Validations by Main Module

## User Management

### Where
- `backend/controllers/authController.js`
- `backend/controllers/userController.js`

### Key validations
- Register:
  - full name letters/spaces only
  - username min length
  - valid email format
  - password min 8 chars
  - role must be one of `ADMIN`, `MANAGER`, `CASHIER`
- Login:
  - username + password required
  - inactive accounts blocked
- User CRUD:
  - object id validity checks
  - full name letters/spaces only
  - username format regex (`3-30`, allowed chars)
  - email required + format checks
  - phone required + format checks
  - password length checks (min 8 chars for create/update)
  - role whitelist (`ADMIN`, `MANAGER`, `CASHIER`)
  - username uniqueness checks
- Permission updates:
  - permissions must be array
  - only allowed permission keys accepted

## Inventory (Products)

### Where
- `backend/controllers/productController.js`

### Key validations
- Product payload normalization before validation
- Required text fields:
  - `name`, `category`, `unitConfig.bulkUnit`, `unitConfig.retailUnit`
- Text format checks for product/category/unit labels and batch IDs
- Numeric non-negative checks:
  - `unitPrice`, `bulkPrice`, `purchasePrice`, `reorderPoint`
- Numeric positivity checks:
  - `unitPrice > 0`, `bulkPrice > 0`, `reorderPoint >= 1`
- Unit conversion:
  - `unitConfig.conversionFactor > 0`
- Stock levels:
  - `stockLevels.bulkQty >= 0`
  - `stockLevels.retailQty >= 0`
- Batch details:
  - `batchDetails[n].costPrice >= 0`
- Forecast-related fields:
  - non-empty `family`
  - `store_nbr` integer >= 1
  - `onpromotion` non-negative
- Stock conversion endpoint:
  - valid `productId`
  - `bulkQty > 0`
  - sufficient bulk stock before conversion

## Suppliers

### Where
- `backend/controllers/supplierController.js`

### Key validations
- Supplier identifier validation (ObjectId/publicId resolver)
- Name:
  - required, letters/spaces only
- Contact person:
  - required, letters/spaces only
- Phone:
  - required, regex format validation (`^[+]?[\d\s-]{9,15}$`)
- Email:
  - required and format-validated
- Address:
  - required, restricted to alphanumeric + common punctuation
- Supply categories:
  - at least one category required
- Outstanding payable:
  - must be numeric and greater than `0`
- Status:
  - must be `ACTIVE` or `INACTIVE`
- Input normalization:
  - trimming text fields
  - lowercase email
  - normalize `supplyCategories`

## POS (Sales / Orders)

### Where
- `backend/controllers/orderController.js`

### Key validations
- Payment type whitelist:
  - `CASH`, `CARD`, `CREDIT`
- Invoice controls:
  - duplicate invoices blocked
  - invoice auto-generated when omitted
- Sales item normalization (`normalizeSaleItems`):
  - product required and valid ObjectId
  - quantity (`qty`/`quantity`) must be > 0
  - unit price must be > 0
  - discount cannot be negative
  - line total cannot be negative
- Sale-level checks:
  - total sale amount must be > 0
  - note length cannot exceed 500
- CREDIT payment:
  - valid credit customer required
- Update guardrails:
  - only `SALE` type updatable via sales update route
  - only `DRAFT` sales can be updated
- Order-level id validation:
  - validates ObjectId in read/update/delete/confirm/item routes

## Credit Customers

### Where
- `backend/controllers/creditController.js`

### Key validations
- Customer payload validation:
  - name required + letters/spaces only
  - phone required + regex format (`^[+]?[\d\s-]{9,15}$`)
  - address required + allowed-character regex
  - credit limit numeric and greater than `0`
  - payment terms integer in range `1..365`
  - status must be `ACTIVE`/`INACTIVE`
  - customer type must be `CREDIT`/`CASH`
- Prevents direct mutation of ledger/balance fields from generic create/update payloads
- ID validation for customer-specific routes
- Payment posting:
  - amount must be positive
  - cannot exceed current outstanding balance
- AI risk calculation route:
  - valid customer id required
  - customer existence required

## Cheques

### Where
- `backend/controllers/chequeController.js`
- `backend/models/Cheque.js`

### Key validations
- Cheque create/update payload:
  - cheque number required and exactly 6 digits (`^\d{6}$`)
  - bank name required + length bounds
  - branch required + max length
  - cheque type must be `Incoming` or `Outgoing`
  - amount must be > 0
  - issue and due dates required/valid
  - due date cannot be before issue date
  - incoming cheques require customer
  - customer id must be valid ObjectId
- Status transition payload (`updateChequeStatus`):
  - status must be one of `PENDING`, `DEPOSITED`, `CLEARED`, `BOUNCED`
  - deposited requires `depositDate`
  - cleared requires `clearedDate`
  - bounced requires `bouncedDate` + `bounceReason`

## 7) Quick Validation Testing Tips

- Use Postman with invalid payloads intentionally to verify each module returns 400 with clear messages.
- Re-test ID-based routes with invalid IDs (`abc123`) to verify 400 handling.
- For POS credit sales, test both with and without `creditCustomerId`.
- For cheques, test strict 6-digit cheque number + each status payload (`DEPOSITED`, `CLEARED`, `BOUNCED`) with required date/reason fields.
- For sales/orders, test duplicate invoices and zero unit-price to verify rejection.

## 8) Reporting/Export Notes

- Reports are served via `backend/routes/reportRoutes.js` under `/api/reports/*` and now map to frontend PDF endpoints.
- Export responses are valid PDF binary streams (not placeholder text), including:
  - sales report and invoice PDF
  - inventory/product reports
  - user reports
  - credit customer profile/ledger reports
  - cheque report
  - supplier profile/list reports
  - purchase order reports
- Supplier list export (`/api/reports/suppliers/pdf`) includes full supplier details:
  - supplier id + name
  - contact person
  - phone/email
  - address
  - supply categories
  - outstanding payable
  - status

## 9) Commit Readiness Checklist

Before pushing to GitHub:

```powershell
# frontend
cd frontend
npm run build

# backend
cd ../backend
npm start
```

Checklist:
- `frontend` build passes
- backend starts with valid `.env`
- AI service starts and responds on `/`
- no `.env`, `node_modules`, `.venv`, or cache files are staged
- commit message references module/docs update clearly

Example commit message:

`docs: add team setup and backend validation guide; chore: update gitignore`
