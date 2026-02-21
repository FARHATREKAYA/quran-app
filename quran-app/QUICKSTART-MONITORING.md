# Quick Start Guide for Monitoring

## Start Everything

```bash
cd /home/farha/Quran-app/quran-app

# Build and start all services including monitoring
docker-compose up -d

# Or start only the monitoring stack
docker-compose up -d prometheus grafana loki promtail node-exporter cadvisor alertmanager
```

## Access Points

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Application | http://localhost:3000 | - |
| Backend API | http://localhost:8000 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin/admin |
| Alertmanager | http://localhost:9093 | - |
| Loki | http://localhost:3100 | - |
| Node Exporter | http://localhost:9100 | - |
| cAdvisor | http://localhost:8080 | - |

## Key Metrics Available

### Application Metrics
- `http_requests_total` - Total requests by method, endpoint, status
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_progress` - Active concurrent requests
- `external_api_requests_total` - External API calls to Quran.com
- `external_api_request_duration_seconds` - External API latency
- `db_query_duration_seconds` - Database query performance

### System Metrics
- `container_*` - Container resource usage from cAdvisor
- `node_*` - Node-level metrics from Node Exporter
- `up` - Service availability

## Logs with Loki

### Query Logs in Grafana

1. Open Grafana at http://localhost:3001
2. Go to Explore (compass icon in left sidebar)
3. Select "Loki" data source

### LogQL Examples

```
# All container logs
{job=~"docker-.*"}

# Backend logs only
{service="backend"}

# Frontend logs only
{service="frontend"}

# Error logs
{job=~"docker-.*"} |= "ERROR"

# Logs containing specific text
{job=~"docker-.*"} |= "database connection"

# Combine filters
{service="backend"} |= "error" |~ "connection.*failed"
```

### LogQL Operators
- `|=` - Line contains string
- `!=` - Line does not contain string
- `|~` - Line matches regex
- `!~` - Line does not match regex

## Useful PromQL Queries

```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate (5xx errors)
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# External API error rate
sum(rate(external_api_requests_total{status="error"}[5m])) / sum(rate(external_api_requests_total[5m]))

# Active requests
sum(http_requests_in_progress)

# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
100 * (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test metrics endpoint
curl http://localhost:8000/metrics

# Generate some traffic
for i in {1..100}; do curl -s http://localhost:8000/api/quran/surahs > /dev/null; done
```

## Troubleshooting

### Services not starting
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### No metrics in Grafana

1. Verify Prometheus data source: http://localhost:3001/datasources
2. Check Prometheus targets: http://localhost:9090/targets
3. Ensure backend is healthy: curl http://localhost:8000/health

### No logs in Grafana

1. Verify Loki data source: http://localhost:3001/datasources
2. Check Promtail is shipping logs: `docker-compose logs promtail`
3. Query Loki directly: `curl http://localhost:3100/loki/api/v1/label/job/values`

### Alerts not firing

1. Check alert rules: http://localhost:9090/rules
2. Check Alertmanager status: http://localhost:9093/#/status
3. Review alertmanager.yml configuration

## Files Created

```
monitoring/
├── prometheus/
│   ├── prometheus.yml          # Prometheus configuration
│   └── rules/
│       └── alerts.yml          # Alerting rules
├── loki/
│   └── loki.yml                # Loki configuration
├── promtail/
│   └── promtail.yml            # Promtail configuration
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml  # Data source config
│   │   └── dashboards/
│   │       └── dashboards.yml   # Dashboard provisioning
│   └── dashboards/
│       ├── api-overview.json    # API metrics dashboard
│       ├── external-api.json    # External API dashboard
│       ├── infrastructure.json  # Infrastructure dashboard
│       └── logs.json            # Logs dashboard
├── alertmanager/
│   └── alertmanager.yml        # Alert routing config
└── README.md                   # Full documentation
```

## Next Steps

1. **Configure Alerting**: Edit `alertmanager/alertmanager.yml` to add your Slack webhook and email settings
2. **Customize Dashboards**: Import and modify dashboards in Grafana
3. **Add Business Metrics**: Track bookmarks, reading sessions, etc.
4. **Configure SSL**: Use nginx or traefik with SSL certificates
