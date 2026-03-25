# CitySafe

Monorepo cu 3 aplicații:
- `apps/api` (Express + Prisma + PostgreSQL)
- `apps/web` (Next.js)
- `apps/mobile` (React Native)

## 1) Cerințe minime
- Node.js `>=20`
- npm
- Docker + Docker Compose
- Pentru mobile: Android Studio (sau Xcode pe macOS)

## 2) Clone
```bash
git clone <REPO_URL>
cd CitySafe
```

## 3) Pornește infrastructura locală
```bash
docker compose -f infra/docker-compose.yml up -d
```
Acest pas pornește:
- PostgreSQL pe `localhost:5432`
- Adminer pe `http://localhost:8080`
- MinIO API pe `http://localhost:9000` și consola pe `http://localhost:9001`

## 4) Instalează dependențele
```bash
cd apps/api && npm ci
cd ../web && npm ci
cd ../mobile && npm ci
cd ../..
```

## 5) Configurează variabilele de mediu
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

## 6) Creează bucket-ul în MinIO
- Intră în `http://localhost:9001`
- Login implicit: `minioadmin / minioadmin123`
- Creează bucket: `citysafe-reports`

## 7) Pregătește baza de date API
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 8) Rulează aplicațiile
### API
```bash
cd apps/api
npm run dev
```

### Web
```bash
cd apps/web
npm run dev
```
Web: `http://localhost:3000`

### Mobile (Android)
Într-un terminal:
```bash
cd apps/mobile
npm start
```
În alt terminal:
```bash
cd apps/mobile
npm run android
```

## 9) Publicare pe GitHub (fără docs)
Folderul `docs/` este ignorat în `.gitignore`.

```bash
git add .
git commit -m "chore: setup reproducible local onboarding"
git push origin develop
```
