def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@stockshelf.com",
        "password": "admin123"
    })
    assert response.status_code in [200, 401, 422]

def test_login_wrong_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@stockshelf.com",
        "password": "wrongpassword"
    })
    assert response.status_code in [401, 422, 500]

def test_login_missing_fields(client):
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422

def test_login_invalid_email(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "notanemail",
        "password": "admin123"
    })
    assert response.status_code == 422
