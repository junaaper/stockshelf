def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200

def test_docs_endpoint(client):
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_endpoint(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data
