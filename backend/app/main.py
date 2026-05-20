import os
import bcrypt
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy.orm import Session

from app.db.database import engine, SessionLocal, Base
from app.models.models import User, Category, Product, StockMovement, Alert
from app.routes import auth, products, categories, stock, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockShelf API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(stock.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


def seed_database(db: Session):
    if db.query(User).count() > 0:
        return

    hashed_admin = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
    hashed_staff = bcrypt.hashpw(b"staff123", bcrypt.gensalt()).decode()

    admin = User(name="Admin User", email="admin@stockshelf.com", password_hash=hashed_admin, role="admin")
    staff = User(name="Staff User", email="staff@stockshelf.com", password_hash=hashed_staff, role="staff")
    db.add_all([admin, staff])
    db.flush()

    electronics = Category(name="Electronics", description="Electronic devices and accessories")
    office = Category(name="Office Supplies", description="Stationery and office materials")
    furniture = Category(name="Furniture", description="Office and warehouse furniture")
    cleaning = Category(name="Cleaning", description="Cleaning supplies and equipment")
    db.add_all([electronics, office, furniture, cleaning])
    db.flush()

    products = [
        Product(name="Laptop Dell XPS 15", sku="ELEC-001", category_id=electronics.id, quantity=5, low_stock_threshold=10, unit="units"),
        Product(name="Wireless Mouse", sku="ELEC-002", category_id=electronics.id, quantity=25, low_stock_threshold=15, unit="units"),
        Product(name="USB-C Hub", sku="ELEC-003", category_id=electronics.id, quantity=8, low_stock_threshold=10, unit="units"),
        Product(name="Monitor 27 inch", sku="ELEC-004", category_id=electronics.id, quantity=3, low_stock_threshold=5, unit="units"),
        Product(name="A4 Paper Ream", sku="OFFC-001", category_id=office.id, quantity=150, low_stock_threshold=50, unit="reams"),
        Product(name="Ballpoint Pens Box", sku="OFFC-002", category_id=office.id, quantity=12, low_stock_threshold=20, unit="boxes"),
        Product(name="Stapler", sku="OFFC-003", category_id=office.id, quantity=6, low_stock_threshold=5, unit="units"),
        Product(name="Office Chair Ergonomic", sku="FURN-001", category_id=furniture.id, quantity=4, low_stock_threshold=5, unit="units"),
        Product(name="Standing Desk", sku="FURN-002", category_id=furniture.id, quantity=2, low_stock_threshold=3, unit="units"),
        Product(name="Floor Cleaner 5L", sku="CLEN-001", category_id=cleaning.id, quantity=30, low_stock_threshold=20, unit="bottles"),
        Product(name="Microfiber Cloths Pack", sku="CLEN-002", category_id=cleaning.id, quantity=45, low_stock_threshold=25, unit="packs"),
        Product(name="Vacuum Cleaner", sku="CLEN-003", category_id=cleaning.id, quantity=2, low_stock_threshold=3, unit="units"),
    ]
    db.add_all(products)
    db.flush()

    now = datetime.utcnow()
    movements = [
        StockMovement(product_id=products[0].id, user_id=admin.id, type="IN", quantity=10, note="Initial stock", created_at=now - timedelta(days=7)),
        StockMovement(product_id=products[0].id, user_id=staff.id, type="OUT", quantity=5, note="Issued to dev team", created_at=now - timedelta(days=6)),
        StockMovement(product_id=products[1].id, user_id=admin.id, type="IN", quantity=30, note="Restock order", created_at=now - timedelta(days=5)),
        StockMovement(product_id=products[1].id, user_id=staff.id, type="OUT", quantity=5, note="Office use", created_at=now - timedelta(days=4)),
        StockMovement(product_id=products[4].id, user_id=admin.id, type="IN", quantity=200, note="Bulk purchase", created_at=now - timedelta(days=4)),
        StockMovement(product_id=products[4].id, user_id=staff.id, type="OUT", quantity=50, note="Monthly consumption", created_at=now - timedelta(days=3)),
        StockMovement(product_id=products[7].id, user_id=admin.id, type="IN", quantity=5, note="New furniture order", created_at=now - timedelta(days=2)),
        StockMovement(product_id=products[7].id, user_id=staff.id, type="OUT", quantity=1, note="Issued to accounts", created_at=now - timedelta(days=1)),
        StockMovement(product_id=products[9].id, user_id=admin.id, type="ADJUSTMENT", quantity=30, note="Inventory count correction", created_at=now - timedelta(days=1)),
        StockMovement(product_id=products[2].id, user_id=staff.id, type="OUT", quantity=2, note="IT department", created_at=now - timedelta(hours=3)),
    ]
    db.add_all(movements)
    db.flush()

    # seed alerts for low-stock products
    for p in products:
        if p.quantity <= p.low_stock_threshold:
            db.add(Alert(product_id=p.id, triggered_at=now))

    db.commit()


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
