# Quran App Monitoring Setup

This directory contains the complete monitoring infrastructure for the Quran application using Prometheus, Grafana, and Loki.

## Overview

The monitoring stack includes:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation and querying
- **Promtail**: Log shipping agent
- **Alertmanager**: Alert routing and notifications
- **Node Exporter**: System-level metrics
- **cAdvisor**: Container metrics

## Quick Start

1. **Start the monitoring stack:**
```bash
docker-compose up -d prometheus grafana loki promtail node-exporter cadvisor alertmanager
```

2. **Access the services:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Alertmanager: http://localhost:9093
- Loki: http://localhost:3100

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Application   │────▶│   Prometheus    │────▶│     Grafana     │
│  (FastAPI)      │     │  (Port 9090)    │     │  (Port 3001)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Alertmanager  │              │
         │              │  (Port 9093)    │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       │              ┌─────────────────┐
┌─────────────────┐              │              │      Loki       │
│     Promtail    │──────────────┘              │  (Port 3100)    │
│  (Log Shipper)  │                             └─────────────────┘
└─────────────────┘

## Metrics Collected

### Application Metrics (from FastAPI)

- **HTTP Requests**
  - Total requests by method, endpoint, and status code
  - Request duration (histogram)
  - Active requests (gauge)

- **External API Calls**
  - Quran.com API request count and duration
  - Success/error rates

- **Database Metrics**
  - Query duration by operation and table
  - Connection pool metrics

- **Cache Metrics**
  - Cache hits/misses

### System Metrics

- **Node Exporter**: CPU, memory, disk, network
- **cAdvisor**: Container resource usage
- **Docker**: Container health and metrics

## Alerting Rules

The following alerts are configured in `prometheus/rules/alerts.yml`:

### Critical Alerts

- **ServiceDown**: Backend service is unreachable
- **HighErrorRate**: Error rate exceeds 5%
- **PrometheusTargetMissing**: Prometheus cannot scrape targets
- **NodeDiskSpace**: Disk space below 10%

### Warning Alerts

- **HighLatency**: P95 latency exceeds 500ms
- **ExternalAPIFailure**: External API error rate exceeds 10%
- **SlowDatabaseQueries**: DB queries slower than 100ms
- **HighMemoryUsage**: Memory usage exceeds 85%
- **HighCPUUsage**: CPU usage exceeds 80%
- **TooManyInProgressRequests**: More than 100 concurrent requests
- **NodeMemoryUsage**: Node memory exceeds 85%
- **NodeCPUUsage**: Node CPU exceeds 85%

## Dashboards

### 1. API Overview Dashboard

- Request rate (requests per second)
- Error rate percentage
- P95 latency
- Active requests gauge
- Request rate by method and status code
- Latency distribution by endpoint

### 2. External API Monitoring

- Quran.com API error rate
- External API P95 latency
- Request rate by status
- Latency by endpoint

### 3. Infrastructure Monitoring

- CPU usage percentage
- Memory usage percentage
- Disk usage percentage
- Service status (Up/Down)

### 4. Application Logs

- Container logs from backend and frontend
- Log filtering by container, service, and level
- Real-time log streaming

## Configuration

### Prometheus Configuration

File: `prometheus/prometheus.yml`

- Scrape interval: 15s
- Retention: 15 days
- Targets: Backend, Node Exporter, cAdvisor, Docker

### Grafana Configuration

- Default credentials: `admin/admin`
- Pre-configured data sources: Prometheus, Loki
- Auto-provisioned dashboards

### Loki Configuration

File: `loki/loki.yml`

- HTTP port: 3100
- Storage: Filesystem
- Retention: Configurable
- Query frontend caching enabled

### Promtail Configuration

File: `promtail/promtail.yml`

- Scrapes Docker container logs
- Ships to Loki at http://loki:3100
- Auto-discovers containers
- Parses JSON logs

### Alertmanager Configuration

File: `alertmanager/alertmanager.yml`

- Email notifications
- Slack notifications (configure webhook URL)
- Alert routing by severity
- Alert grouping and inhibition

## Usage

### Viewing Metrics

1. Open Prometheus at http://localhost:9090
2. Use the expression browser to query metrics
3. Example queries:
```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Active requests
sum(http_requests_in_progress)
```

### Viewing Logs

1. Open Grafana at http://localhost:3001
2. Navigate to Explore (compass icon)
3. Select "Loki" data source
4. Query examples:
```
# All container logs
{job=~"docker-.*"}

# Backend logs only
{service="backend"}

# Error logs
{job=~"docker-.*"} |= "ERROR"

# Logs containing specific text
{job=~"docker-.*"} |= "database connection"
```

### Creating Custom Dashboards

1. Log into Grafana at http://localhost:3001
2. Create a new dashboard
3. Add panels with Prometheus queries
4. Save to `grafana/dashboards/` for persistence

### Testing Alerts

1. Open Alertmanager at http://localhost:9093
2. View active alerts
3. Test alert routing by triggering conditions

## Instrumentation Guide

### Adding Custom Metrics

1. Import the monitoring module:
   ```python
   from monitoring import track_db_query, track_external_api_call
   ```

2. Track database queries:
   ```python
   with track_db_query(operation="SELECT", table="surahs"):
       result = await db.execute(query)
   ```

3. Track external API calls:
   ```python
   with track_external_api_call(api_name="quran-com", endpoint="/v4/chapters"):
       response = await client.get(url)
   ```

4. Record cache metrics:
   ```python
   from monitoring import record_cache_hit, record_cache_miss

   if cache_hit:
       record_cache_hit(cache_name="surah-cache")
   else:
       record_cache_miss(cache_name="surah-cache")
   ```

## Maintenance

### Backup

- Prometheus data: `prometheus_data` volume
- Grafana dashboards: `monitoring/grafana/dashboards/`

### Cleanup

```bash
# Stop all monitoring services
docker-compose stop prometheus grafana alertmanager node-exporter cadvisor

# Remove volumes (WARNING: data will be lost)
docker-compose down -v
```

### Updating

```bash
# Pull latest images
docker-compose pull prometheus grafana alertmanager

# Restart services
docker-compose up -d prometheus grafana alertmanager
```

## Troubleshooting

### Prometheus not scraping targets

1. Check if services are healthy:
   ```bash
   docker-compose ps
   ```

2. Verify network connectivity:
   ```bash
   docker-compose exec prometheus wget -qO- http://backend:8000/health
   ```

3. Check Prometheus targets:
   - Open http://localhost:9090/targets

### Grafana not showing data

1. Verify data source is configured:
   - Configuration > Data Sources > Prometheus

2. Check Prometheus is accessible from Grafana:
   ```bash
   docker-compose exec grafana wget -qO- http://prometheus:9090/-/healthy
   ```

### No metrics in /metrics endpoint

1. Verify monitoring middleware is enabled in `main.py`
2. Check for import errors in logs:
   ```bash
   docker-compose logs backend
   ```

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)
- [FastAPI Prometheus Middleware](https://github.com/trallnag/prometheus-fastapi-instrumentator)
