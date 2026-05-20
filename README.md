# StockShelf

A three-tier inventory management web application built with React, FastAPI, and PostgreSQL.

## Overview

StockShelf provides real-time inventory tracking with:
- Product management with SKU, categories, and low-stock thresholds
- Stock movement logging (IN / OUT / ADJUSTMENT)
- Automated low-stock alerts
- Dashboard with KPIs and charts
- Role-based access control (admin / staff)
- JWT authentication
- Prometheus metrics endpoint

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, TypeScript, Vite, TailwindCSS, Recharts |
| Backend   | FastAPI (Python 3.11), SQLAlchemy, Alembic, python-jose |
| Database  | PostgreSQL 15                           |
| Infra     | Docker, Docker Compose, Nginx           |

---

## Local Setup with Docker Compose

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v2+

### Start the application

```bash
# From the stockshelf/ directory
docker compose up --build
```

This will:
1. Start a PostgreSQL 15 database
2. Build and start the FastAPI backend (waits for DB to be healthy)
3. Build and start the React frontend served via Nginx
4. Seed the database with demo data on first run

### Access the application

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:3000      |
| Backend API | http://localhost:8000   |
| API Docs (Swagger) | http://localhost:8000/docs |
| Prometheus Metrics | http://localhost:8000/metrics |

---

## Environment Variables

Stored in `.env` at the project root. Do not commit production secrets.

| Variable          | Default                                                    | Description             |
|-------------------|------------------------------------------------------------|-------------------------|
| POSTGRES_DB       | stockshelf                                                 | Database name           |
| POSTGRES_USER     | stockshelf_user                                            | Database user           |
| POSTGRES_PASSWORD | stockshelf_pass                                            | Database password       |
| DATABASE_URL      | postgresql://stockshelf_user:stockshelf_pass@db:5432/stockshelf | Full DB connection URL |
| JWT_SECRET        | supersecretjwtkey_changeinproduction                       | JWT signing secret — **change in production** |

---

## Default Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@stockshelf.com     | admin123  |
| Staff | staff@stockshelf.com     | staff123  |

**Admin** can create/edit/delete products and categories, resolve alerts.  
**Staff** can view all data and log stock movements.

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

All endpoints except `/auth/login` require `Authorization: Bearer <access_token>`.

### Auth
| Method | Path              | Description                     |
|--------|-------------------|---------------------------------|
| POST   | /auth/login       | Login, returns tokens + user    |
| POST   | /auth/refresh     | Refresh access token            |

### Products
| Method | Path              | Auth     | Description                        |
|--------|-------------------|----------|------------------------------------|
| GET    | /products/        | Any      | List products (search, filter, paginate) |
| POST   | /products/        | Admin    | Create product                     |
| PUT    | /products/{id}    | Admin    | Update product                     |
| DELETE | /products/{id}    | Admin    | Delete product                     |

### Categories
| Method | Path                  | Auth  | Description                       |
|--------|-----------------------|-------|-----------------------------------|
| GET    | /categories/          | Any   | List categories with product count |
| POST   | /categories/          | Admin | Create category                   |
| DELETE | /categories/{id}      | Admin | Delete category (blocked if products exist) |

### Stock
| Method | Path                | Auth | Description                       |
|--------|---------------------|------|-----------------------------------|
| POST   | /stock/movement     | Any  | Log a stock movement              |
| GET    | /stock/movements    | Any  | List movements with filters       |

### Dashboard
| Method | Path                          | Auth  | Description                 |
|--------|-------------------------------|-------|-----------------------------|
| GET    | /dashboard/summary            | Any   | KPIs, alerts, recent movements |
| PATCH  | /dashboard/alerts/{id}/resolve | Admin | Resolve a low-stock alert  |

---

## Project Structure

```
stockshelf/
├── frontend/          # React + TypeScript + Vite app
│   ├── src/
│   │   ├── api/       # Axios API clients per domain
│   │   ├── components/# Reusable UI components
│   │   ├── pages/     # Route-level page components
│   │   └── types/     # Shared TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── auth/      # JWT helpers
│   │   ├── db/        # SQLAlchemy engine & session
│   │   ├── models/    # ORM models
│   │   ├── routes/    # API route handlers
│   │   └── schemas/   # Pydantic schemas
│   ├── alembic/       # Database migrations
│   └── Dockerfile
├── docker-compose.yml
└── .env
```
