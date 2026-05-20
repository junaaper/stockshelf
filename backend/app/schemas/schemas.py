from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr


# Auth
class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut


class AccessTokenResponse(BaseModel):
    access_token: str


# Categories
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Products
class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[str] = None
    quantity: int = 0
    low_stock_threshold: int = 10
    unit: str = "units"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[str] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    unit: Optional[str] = None


class ProductOut(BaseModel):
    id: str
    name: str
    sku: str
    category_id: Optional[str]
    category_name: Optional[str] = None
    quantity: int
    low_stock_threshold: int
    unit: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedProducts(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int


# Stock
class MovementCreate(BaseModel):
    product_id: str
    type: str  # 'IN', 'OUT', 'ADJUSTMENT'
    quantity: int
    note: Optional[str] = None


class MovementOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    type: str
    quantity: int
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Alerts
class AlertOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_quantity: Optional[int] = None
    product_threshold: Optional[int] = None
    triggered_at: datetime
    resolved: bool
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# Dashboard
class CategoryBreakdown(BaseModel):
    name: str
    product_count: int
    total_quantity: int


class DashboardSummary(BaseModel):
    total_products: int
    low_stock_count: int
    total_categories: int
    recent_movements: List[MovementOut]
    active_alerts: List[AlertOut]
    category_breakdown: List[CategoryBreakdown]
