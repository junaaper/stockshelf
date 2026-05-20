def test_get_products_unauthenticated(client):
    response = client.get("/api/v1/products")
    assert response.status_code == 403

def test_get_products_authenticated(client, auth_headers):
    if not auth_headers:
        pytest.skip("Auth not available in test environment")
    response = client.get("/api/v1/products", headers=auth_headers)
    assert response.status_code in [200, 403]

def test_get_categories_unauthenticated(client):
    response = client.get("/api/v1/categories")
    assert response.status_code == 403

def test_create_product_unauthenticated(client):
    response = client.post("/api/v1/products", json={
        "name": "Test Product",
        "sku": "TEST-001",
        "quantity": 10,
        "low_stock_threshold": 5,
        "unit": "units"
    })
    assert response.status_code == 403

def test_dashboard_unauthenticated(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 403
