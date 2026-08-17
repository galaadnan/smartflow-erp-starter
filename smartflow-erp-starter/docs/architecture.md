# SmartFlow ERP — Architecture

```text
Users
  |
  v
Next.js Frontend
  |
  v
NestJS API
  |
  +------> PostgreSQL
  |
  +------> AI Business Copilot

PostgreSQL
  |
  +------> Power BI Analytics
```

## Principles
- Multi-tenant ready
- RBAC permissions
- API-first backend
- Shared PostgreSQL source of truth
- Analytics separated from operational UI
- Secrets stored only in environment variables
