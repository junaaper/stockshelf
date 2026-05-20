from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Product, Category
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductOut, PaginatedProducts
from app.auth.jwt import get_current_user, require_admin
from app.models.models import User

router = APIRouter(prefix="/products", tags=["products"])


def to_product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        sku=p.sku,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        quantity=p.quantity,
        low_stock_threshold=p.low_stock_threshold,
        unit=p.unit,
        created_at=p.created_at,
    )


@router.get("/", response_model=PaginatedProducts)
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Product)
    if search:
        q = q.filter((Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%")))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if low_stock is True:
        q = q.filter(Product.quantity <= Product.low_stock_threshold)
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedProducts(
        items=[to_product_out(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProductCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(Product).filter(Product.sku == body.sku).first():
        raise HTTPException(status_code=409, detail="SKU already exists")
    if body.category_id and not db.query(Category).filter(Category.id == body.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    p = Product(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return to_product_out(p)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: str, body: ProductUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return to_product_out(p)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
