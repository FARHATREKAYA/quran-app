"""
Monitoring module for FastAPI application with Prometheus metrics.
"""
import time
from typing import Callable
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests currently in progress',
    ['method', 'endpoint']
)

# External API Metrics (for Quran.com API calls)
external_api_requests_total = Counter(
    'external_api_requests_total',
    'Total external API requests',
    ['api_name', 'endpoint', 'status']
)

external_api_request_duration_seconds = Histogram(
    'external_api_request_duration_seconds',
    'External API request duration in seconds',
    ['api_name', 'endpoint'],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Database Metrics
db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['operation', 'table'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

db_connections_idle = Gauge(
    'db_connections_idle',
    'Number of idle database connections'
)

# Application Metrics
active_users = Gauge(
    'active_users',
    'Number of currently active users'
)

total_bookmarks = Gauge(
    'total_bookmarks',
    'Total number of bookmarks in the system'
)

total_khatm_sessions = Gauge(
    'total_khatm_sessions',
    'Total number of Khatm reading sessions'
)

# Cache Metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_name']
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_name']
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics for HTTP requests."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        method = request.method
        path = request.url.path
        
        # Skip metrics endpoint to avoid infinite loop
        if path == '/metrics':
            return await call_next(request)
        
        # Track in-progress requests
        http_requests_in_progress.labels(method=method, endpoint=path).inc()
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = str(response.status_code)
            
            # Record metrics
            http_requests_total.labels(
                method=method,
                endpoint=path,
                status_code=status_code
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=path
            ).observe(time.time() - start_time)
            
            return response
            
        except Exception as e:
            # Record failed requests
            http_requests_total.labels(
                method=method,
                endpoint=path,
                status_code='500'
            ).inc()
            raise
            
        finally:
            http_requests_in_progress.labels(method=method, endpoint=path).dec()


class ExternalAPIMetrics:
    """Context manager for timing external API calls."""
    
    def __init__(self, api_name: str, endpoint: str):
        self.api_name = api_name
        self.endpoint = endpoint
        self.start_time = None
        self.status = 'success'
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        
        if exc_type is not None:
            self.status = 'error'
        
        external_api_requests_total.labels(
            api_name=self.api_name,
            endpoint=self.endpoint,
            status=self.status
        ).inc()
        
        external_api_request_duration_seconds.labels(
            api_name=self.api_name,
            endpoint=self.endpoint
        ).observe(duration)


class DatabaseMetrics:
    """Context manager for timing database queries."""
    
    def __init__(self, operation: str, table: str):
        self.operation = operation
        self.table = table
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        db_query_duration_seconds.labels(
            operation=self.operation,
            table=self.table
        ).observe(duration)


def setup_metrics(app: FastAPI):
    """Set up Prometheus metrics for the FastAPI application."""
    
    # Add middleware
    app.add_middleware(PrometheusMiddleware)
    
    # Add metrics endpoint
    @app.get('/metrics', tags=['monitoring'])
    async def metrics():
        """Prometheus metrics endpoint."""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )


def track_external_api_call(api_name: str, endpoint: str):
    """Decorator/context manager factory for external API calls."""
    return ExternalAPIMetrics(api_name, endpoint)


def track_db_query(operation: str, table: str):
    """Decorator/context manager factory for database queries."""
    return DatabaseMetrics(operation, table)


def record_cache_hit(cache_name: str = 'default'):
    """Record a cache hit."""
    cache_hits_total.labels(cache_name=cache_name).inc()


def record_cache_miss(cache_name: str = 'default'):
    """Record a cache miss."""
    cache_misses_total.labels(cache_name=cache_name).inc()
