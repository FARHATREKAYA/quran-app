"""
Unit tests for Quran API endpoints
"""
import pytest
import httpx
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test health check returns healthy status"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_health_check_response_time(self):
        """Test health check responds quickly"""
        import time
        start = time.time()
        response = client.get("/health")
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 1.0  # Should respond in less than 1 second


class TestSurahEndpoints:
    """Test Surah-related endpoints"""

    def test_get_all_surahs(self):
        """Test getting all 114 surahs"""
        response = client.get("/api/quran/surahs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 114

        # Check first surah (Al-Fatiha)
        first_surah = data[0]
        assert first_surah["number"] == 1
        assert first_surah["name_english"] == "Al-Fatihah"
        assert "name_arabic" in first_surah
        assert "verse_count" in first_surah

    def test_get_single_surah(self):
        """Test getting a specific surah"""
        response = client.get("/api/quran/surahs/1")
        assert response.status_code == 200
        data = response.json()
        assert data["number"] == 1
        assert data["name_english"] == "Al-Fatihah"
        assert data["verse_count"] == 7

    def test_get_surah_not_found(self):
        """Test getting non-existent surah returns 404"""
        response = client.get("/api/quran/surahs/999")
        assert response.status_code == 404

    def test_get_surah_verses(self):
        """Test getting surah with verses"""
        response = client.get("/api/quran/surahs/1/verses")
        assert response.status_code == 200
        data = response.json()
        assert "surah" in data
        assert "verses" in data
        assert isinstance(data["verses"], list)
        assert len(data["verses"]) == 7  # Al-Fatiha has 7 verses

        # Check verse structure
        first_verse = data["verses"][0]
        assert "id" in first_verse
        assert "text_arabic" in first_verse
        assert "text_english" in first_verse
        assert "verse_number_in_surah" in first_verse

    def test_get_surah_verses_invalid(self):
        """Test getting verses for invalid surah"""
        response = client.get("/api/quran/surahs/999/verses")
        assert response.status_code == 404


class TestAudioEndpoints:
    """Test audio-related endpoints"""

    def test_get_audio(self):
        """Test getting audio URL for a surah"""
        response = client.get("/api/quran/audio/1?reciter=1")
        # Note: This will fail without internet, so we check for either 200 or error
        assert response.status_code in [200, 404, 500]

        if response.status_code == 200:
            data = response.json()
            assert "audio_url" in data
            assert "surah_number" in data
            assert data["surah_number"] == 1

    def test_get_timestamps(self):
        """Test getting verse timestamps"""
        response = client.get("/api/quran/timestamps/1?reciter=1")
        assert response.status_code == 200
        data = response.json()
        assert data["surah_number"] == 1
        assert "source" in data

    def test_get_verse_audio(self):
        """Test getting audio for a specific verse"""
        response = client.get("/api/quran/audio/verse/1/1")
        assert response.status_code in [200, 404]  # May return 404 if audio not available
        
        if response.status_code == 200:
            data = response.json()
            assert "audio_url" in data
            assert data["surah_number"] == 1
            assert data["verse_number"] == 1


class TestSearchEndpoint:
    """Test search functionality"""

    def test_search_verses(self):
        """Test searching verses"""
        response = client.get("/api/quran/search?query=merciful&search_in=translation&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert "count" in data
        assert data["query"] == "merciful"
        assert isinstance(data["results"], list)

    def test_search_min_length(self):
        """Test search requires minimum query length"""
        response = client.get("/api/quran/search?query=a")
        assert response.status_code == 422  # Validation error

    def test_search_arabic(self):
        """Test searching in Arabic text"""
        response = client.get("/api/quran/search?query=%D8%A7%D9%84%D9%84%D9%87&search_in=arabic&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "الله"
        assert "results" in data


class TestAuthenticationEndpoints:
    """Test authentication endpoints"""

    def test_register_user(self):
        """Test user registration"""
        import uuid
        unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
        response = client.post("/api/auth/register", json={
            "username": unique_username,
            "password": "testpassword123"
        })
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["username"] == unique_username

    def test_register_duplicate_username(self):
        """Test registering with duplicate username fails"""
        import uuid
        unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
        # First registration
        client.post("/api/auth/register", json={
            "username": unique_username,
            "password": "testpassword123"
        })
        # Second registration with same username
        response = client.post("/api/auth/register", json={
            "username": unique_username,
            "password": "testpassword123"
        })
        assert response.status_code == 400

    def test_login_user(self):
        """Test user login"""
        import uuid
        unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
        # Register user first
        client.post("/api/auth/register", json={
            "username": unique_username,
            "password": "testpassword123"
        })
        # Login
        response = client.post("/api/auth/login", json={
            "username": unique_username,
            "password": "testpassword123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", json={
            "username": "nonexistentuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_get_current_user_unauthorized(self):
        """Test getting current user without token fails"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401


class TestBookmarkEndpoints:
    """Test bookmark endpoints"""

    def test_get_bookmarks_unauthorized(self):
        """Test getting bookmarks without authentication"""
        response = client.get("/api/bookmarks")
        assert response.status_code == 401

    def test_create_bookmark_unauthorized(self):
        """Test creating bookmark without authentication"""
        response = client.post("/api/bookmarks", json={
            "verse_id": 1,
            "notes": "Test bookmark"
        })
        assert response.status_code == 401


class TestKhatmEndpoints:
    """Test Khatm (reading schedule) endpoints"""

    def test_get_khatm_unauthorized(self):
        """Test getting Khatm schedules without authentication"""
        response = client.get("/api/khatm")
        assert response.status_code == 401

    def test_create_khatm_unauthorized(self):
        """Test creating Khatm without authentication"""
        response = client.post("/api/khatm", json={
            "title": "Test Khatm",
            "frequency": "daily",
            "time": "19:00",
            "timezone": "UTC"
        })
        assert response.status_code == 401


class TestVerseInteractionEndpoints:
    """Test verse interaction endpoints (comments, reports)"""

    def test_get_comments(self):
        """Test getting comments for a verse"""
        response = client.get("/api/verses/1/comments")
        assert response.status_code in [200, 404]

    def test_create_comment_unauthorized(self):
        """Test creating comment without authentication"""
        response = client.post("/api/verses/1/comments", json={
            "content": "Test comment",
            "is_public": True
        })
        assert response.status_code == 401

    def test_create_report_unauthorized(self):
        """Test creating report without authentication"""
        response = client.post("/api/verses/1/reports", json={
            "type": "translation_error",
            "description": "Test report"
        })
        assert response.status_code == 401


class TestSwaggerDocs:
    """Test Swagger/OpenAPI documentation"""

    def test_swagger_ui_accessible(self):
        """Test Swagger UI is accessible"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_openapi_json_accessible(self):
        """Test OpenAPI JSON is accessible"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert data["info"]["title"] == "Quran API"
        assert "paths" in data

    def test_redoc_accessible(self):
        """Test ReDoc documentation is accessible"""
        response = client.get("/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


class TestCORS:
    """Test CORS configuration"""

    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.get("/api/quran/surahs")
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"


class TestPerformance:
    """Performance tests"""

    def test_get_all_surahs_performance(self):
        """Test getting all surahs responds within acceptable time"""
        import time
        start = time.time()
        response = client.get("/api/quran/surahs")
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 2.0  # Should complete in under 2 seconds

    def test_get_surah_verses_performance(self):
        """Test getting surah verses responds quickly"""
        import time
        start = time.time()
        response = client.get("/api/quran/surahs/2/verses")  # Al-Baqarah (long surah)
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 3.0  # Should complete in under 3 seconds

    def test_search_performance(self):
        """Test search responds within acceptable time"""
        import time
        start = time.time()
        response = client.get("/api/quran/search?query=merciful&limit=10")
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 2.0  # Should complete in under 2 seconds


class TestMetricsEndpoint:
    """Test Prometheus metrics endpoint"""

    def test_metrics_accessible(self):
        """Test metrics endpoint returns Prometheus format"""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")
        # Check for common Prometheus metrics
        assert b"http_requests_total" in response.content or b"http_request_duration" in response.content
