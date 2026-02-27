# MVP 0 - Fundament tehnic

Scop: infrastructura stabila ca sa putem dezvolta fara haos.

## Cerinte (MVP 0)
- Structura repo: apps/api, apps/mobile, apps/admin-web, infra/, docs/
- Docker: PostgreSQL + Adminer
- Prisma: schema + migrate + seed (Chisinau, Balti + categorii)
- API skeleton: /health, CORS, JSON, error handler
- Test: DB pornește, API pornește, query Prisma ok

## Comenzi rapide
```bash
docker compose -f infra/docker-compose.yml up -d
cd apps/api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Test rapid
```bash
curl http://localhost:4000/health
curl http://localhost:4000/cities
curl http://localhost:4000/categories
curl http://localhost:4000/reports
```

## Endpointuri minime
- GET /health
- GET /cities
- GET /categories
- GET /reports
- POST /reports

## Note
- Pozele nu se stocheaza in DB. Se salveaza in storage extern, iar in DB se tin doar URL-uri si metadata.
