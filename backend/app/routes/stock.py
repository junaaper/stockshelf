from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import StockMovement, Product, Alert, User
from app.schemas.schemas import MovementCreate, MovementOut
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/stock", tags=["stock"])


def check_and_update_alert(db: Session, product: Product):
    alert = db.query(Alert).filter(Alert.product_id == product.id).first()
    if product.quantity <= product.low_stock_threshold:
        if not alert:
            alert = Alert(product_id=product.id)
            db.add(alert)
        else:
            alert.resolved = False
            alert.resolved_at = None
    else:
        if alert and not alert.resolved:
            alert.resolved = True
            alert.resolved_at = datetime.utcnow()
    db.commit()


def to_movement_out(m: StockMovement) -> MovementOut:
    return MovementOut(
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


@router.post("/movement", response_model=MovementOut, status_code=status.HTTP_201_CREATED)
def log_movement(body: MovementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if body.type not in ("IN", "OUT", "ADJUSTMENT"):
        raise HTTPException(status_code=400, detail="Invalid movement type. Must be IN, OUT, or ADJUSTMENT")

    if body.type == "IN":
        product.quantity += body.quantity
    elif body.type == "OUT":
        if product.quantity < body.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.quantity -= body.quantity
    elif body.type == "ADJUSTMENT":
        product.quantity = body.quantity

    movement = StockMovement(
        product_id=body.product_id,
        user_id=current_user.id,
        type=body.type,
        quantity=body.quantity,
        note=body.note,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)

    check_and_update_alert(db, product)
    db.refresh(movement)

    return to_movement_out(movement)


@router.get("/movements", response_model=List[MovementOut])
def list_movements(
    product_id: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(StockMovement).order_by(StockMovement.created_at.desc())
    if product_id:
        q = q.filter(StockMovement.product_id == product_id)
    if from_date:
        q = q.filter(StockMovement.created_at >= from_date)
    if to_date:
        q = q.filter(StockMovement.created_at <= to_date)
    if type:
        q = q.filter(StockMovement.type == type)
    return [to_movement_out(m) for m in q.limit(200).all()]
