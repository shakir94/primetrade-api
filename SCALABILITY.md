# Scalability Notes

## Current Architecture

This project is a monolithic Node.js + Express app with SQLite — ideal for development and initial deployment. Below is how it can scale progressively.

---

## Phase 1 – Production-Ready Monolith

**Database → PostgreSQL / MySQL**
- Replace `better-sqlite3` with `pg` or `mysql2`
- Add connection pooling (`pg-pool`) — SQLite doesn't support concurrent writes
- Add database migrations (Knex.js or Prisma)

**Caching → Redis**
```
User → hits /api/v1/tasks
       ↓
   Check Redis cache (key: `tasks:user:<id>:page:<n>`)
       ↓ miss
   Query PostgreSQL → store in Redis (TTL: 60s)
       ↓
   Return cached result on next request
```
- Cache `/admin/stats` (rarely changes, expensive query)
- Cache user profile from JWT `/auth/me`
- Invalidate cache on task create/update/delete

**Process Management**
- Use `PM2` with cluster mode to utilize all CPU cores:
  ```bash
  pm2 start server.js -i max
  ```

---

## Phase 2 – Horizontal Scaling

**Load Balancer (Nginx / AWS ALB)**
```
Client → Nginx (load balancer)
           ├── Node instance 1 (:5001)
           ├── Node instance 2 (:5002)
           └── Node instance 3 (:5003)
               ↓
         Shared PostgreSQL + Redis
```
- Stateless JWT design already supports this — no sticky sessions needed
- Redis handles shared session state if needed

**Containerization (Docker)**
```yaml
# Example docker-compose.yml structure
services:
  api:
    build: ./backend
    scale: 3          # 3 API containers
  postgres:
    image: postgres:16
  redis:
    image: redis:7-alpine
  nginx:
    image: nginx:alpine
```

---

## Phase 3 – Microservices (High Scale)

Break the monolith into independent services:

| Service          | Responsibility                        |
|-----------------|---------------------------------------|
| Auth Service     | Register, Login, JWT validation       |
| Task Service     | CRUD for tasks                        |
| Notification Svc | Email/push alerts on task updates     |
| Admin Service    | Analytics, user management            |
| API Gateway      | Route all requests, rate limit        |

**Inter-service communication**: REST or message queues (RabbitMQ / Kafka)

---

## Phase 4 – Cloud-Native

- **Auto-scaling**: AWS ECS / Kubernetes HPA based on CPU/request load
- **Database**: AWS RDS (PostgreSQL) with read replicas for analytics queries
- **Cache**: AWS ElastiCache (Redis)
- **CDN**: CloudFront for static frontend assets
- **Monitoring**: Prometheus + Grafana, or AWS CloudWatch
- **Logging**: Winston + structured JSON logs → Elasticsearch/Datadog

---

## Estimated Capacity

| Setup                        | Requests/sec | Notes                         |
|------------------------------|-------------|-------------------------------|
| Current (SQLite, 1 process)  | ~200         | Dev/demo only                 |
| PostgreSQL + PM2 cluster     | ~2,000       | Small to medium production    |
| + Redis caching              | ~5,000       | Cache hit rate ~80%           |
| + 3 Docker containers + Nginx| ~15,000      | Mid-scale                     |
| Kubernetes autoscaling       | 100,000+     | Enterprise scale              |

---

## Already Scalable in This Codebase

- ✅ **Stateless JWT** — no server-side sessions, works across multiple instances
- ✅ **API versioning** (`/api/v1/`) — can release `/api/v2/` without breaking clients
- ✅ **Modular route structure** — easy to extract into microservices
- ✅ **Environment-based config** — different settings per environment via `.env`
- ✅ **WAL mode on SQLite** — better concurrent read performance (dev only)
- ✅ **Pagination** on list endpoints — prevents memory overload on large datasets
- ✅ **Rate limiting** — prevents abuse and DDoS at the application level
