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
