from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import Product, Category, StockMovement, Alert, User
from app.schemas.schemas import DashboardSummary, MovementOut, AlertOut, CategoryBreakdown
from app.auth.jwt import get_current_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_products = db.query(func.count(Product.id)).scalar()
    low_stock_count = db.query(func.count(Product.id)).filter(Product.quantity <= Product.low_stock_threshold).scalar()
    total_categories = db.query(func.count(Category.id)).scalar()

    recent_mvts = (
        db.query(StockMovement)
        .order_by(StockMovement.created_at.desc())
        .limit(8)
        .all()
    )
    recent_movements = [
        MovementOut(
            id=m.id,
            product_id=m.product_id,
            product_name=m.product.name if m.product else None,
            user_id=m.user_id,
            user_name=m.user.name if m.user else None,
            type=m.type,
            quantity=m.quantity,
            note=m.note,
            created_at=m.created_at,
        )
        for m in recent_mvts
    ]

    active_alert_rows = (
        db.query(Alert)
        .filter(Alert.resolved == False)
        .all()
    )
    active_alerts = [
        AlertOut(
            id=a.id,
            product_id=a.product_id,
            product_name=a.product.name if a.product else None,
            product_quantity=a.product.quantity if a.product else None,
            product_threshold=a.product.low_stock_threshold if a.product else None,
            triggered_at=a.triggered_at,
            resolved=a.resolved,
            resolved_at=a.resolved_at,
        )
        for a in active_alert_rows
    ]

    category_rows = (
        db.query(
            Category.name,
            func.count(Product.id).label("product_count"),
            func.coalesce(func.sum(Product.quantity), 0).label("total_quantity"),
        )
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id, Category.name)
        .all()
    )
    category_breakdown = [
        CategoryBreakdown(name=row.name, product_count=row.product_count, total_quantity=row.total_quantity)
        for row in category_rows
    ]

    return DashboardSummary(
        total_products=total_products,
        low_stock_count=low_stock_count,
        total_categories=total_categories,
        recent_movements=recent_movements,
        active_alerts=active_alerts,
        category_breakdown=category_breakdown,
    )


@router.patch("/alerts/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return AlertOut(
        id=alert.id,
        product_id=alert.product_id,
        product_name=alert.product.name if alert.product else None,
        product_quantity=alert.product.quantity if alert.product else None,
        product_threshold=alert.product.low_stock_threshold if alert.product else None,
        triggered_at=alert.triggered_at,
        resolved=alert.resolved,
        resolved_at=alert.resolved_at,
    )
