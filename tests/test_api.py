# -------------------------------------------------
# HELPER: GET ADMIN TOKEN
# -------------------------------------------------
def get_admin_token(client):
    response = client.post(
        "/admin/login",
        data={
            "username": "admin",
            "password": "admin123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


# -------------------------------------------------
# TEST 1: ADMIN LOGIN
# -------------------------------------------------
def test_admin_login(client):
    response = client.post(
        "/admin/login",
        data={
            "username": "admin",
            "password": "admin123"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


# -------------------------------------------------
# TEST 2: ADD TOOL (ADMIN)
# -------------------------------------------------
def test_add_tool(client):
    token = get_admin_token(client)

    response = client.post(
        "/admin/tool",
        json={
            "name": "ChatGPT",
            "use_case": "Text Generation",
            "category": "NLP",
            "pricing_type": "Free"
        },
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200
    assert response.json()["name"] == "ChatGPT"
    assert response.json()["rating"] == 0


# -------------------------------------------------
# TEST 3: SUBMIT REVIEW (USER)
# -------------------------------------------------
def test_submit_review(client):
    response = client.post(
        "/review",
        json={
            "tool_id": 1,
            "user_rating": 5,
            "comment": "Excellent AI tool"
        }
    )

    assert response.status_code == 200
    assert response.json()["status"] == "pending"


# -------------------------------------------------
# TEST 4: APPROVE REVIEW & CHECK AVERAGE RATING
# -------------------------------------------------
def test_approve_review_and_average_rating(client):
    token = get_admin_token(client)

    response = client.put(
        "/admin/review/1/approved",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    tools_response = client.get("/tools")
    tools = tools_response.json()

    assert tools[0]["rating"] == 5.0


# -------------------------------------------------
# TEST 5: VIEW REVIEWS (ADMIN)
# -------------------------------------------------
def test_view_reviews(client):
    token = get_admin_token(client)

    response = client.get(
        "/admin/reviews",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1