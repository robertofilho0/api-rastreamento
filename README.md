# 📦 API de Rastreamento de Encomendas

[![CI](https://github.com/robertofilho0/api-rastreamento/actions/workflows/ci.yml/badge.svg)](https://github.com/robertofilho0/api-rastreamento/actions/workflows/ci.yml)
![NestJS](https://img.shields.io/badge/nestjs-12-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-17-4169E1?logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/rabbitmq-4-FF6600?logo=rabbitmq&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

API de rastreamento de encomendas em **NestJS + TypeScript** com **validação do código no padrão S10 dos Correios**, **provedores plugáveis** (mock ou AfterShip), cache e **consulta em lote assíncrona processada por fila no RabbitMQ**.

## ✨ Destaques

- **Validação real do código de rastreio**: formato `AA123456785BR` e dígito verificador (pesos 8-6-4-2-3-5-9-7, módulo 11). Códigos inválidos são barrados antes de qualquer chamada externa.
- **Lotes assíncronos com RabbitMQ**: `POST /api/lotes` grava o lote no PostgreSQL, publica `tracking.batch.requested` e responde `202 Accepted` na hora. Um worker (`@EventPattern`, ack manual) consulta os códigos de 5 em 5 e grava cada resultado. O cliente acompanha o progresso em `GET /api/lotes/:id`.
- **Worker idempotente**: o lote só sai de `PENDING` uma vez (update condicional), então uma mensagem entregue duas vezes não reprocessa nada.
- **Falhas isoladas**: um código com erro não derruba o lote. Cada item guarda sucesso, erro ou resultado.
- **Provedores plugáveis (Strategy + DI)**: `mock` (padrão, histórico simulado e determinístico) ou `aftership` (integração real), escolhidos por variável de ambiente.
- **Resposta normalizada**: status padronizado, flag `entregue` e eventos ordenados, independente do provedor.
- **Cache com TTL** e header `X-Cache: HIT | MISS`. Timeout nas chamadas externas, com erros mapeados para `502` e `504`.
- **Funciona sem broker**: sem `RABBITMQ_URL`, os lotes são processados em segundo plano no próprio processo.

## 🧱 Stack

NestJS 12 · TypeScript · PostgreSQL 17 · Prisma 7 · RabbitMQ 4 (`@nestjs/microservices`) · Zod · Swagger · Vitest · Supertest · Docker

## 🏗️ Fluxo do lote

```
POST /api/lotes ──► grava lote + itens (PENDING) ──► publica tracking.batch.requested ──► 202 { id, statusUrl }
                                                              │
                                                              ▼
                                            JobsConsumer (RabbitMQ, ack manual)
                                              └─ JobsProcessor: PENDING → PROCESSING
                                                   └─ consulta 5 códigos por vez → grava cada item
                                                   └─ DONE (ou FAILED)

GET /api/lotes/:id ──► { status, progress, processed, succeeded, resultados[] }
```

## 📁 Estrutura

```
src/
├── tracking/
│   ├── codigo-rastreio.ts       # validação S10 e dígito verificador
│   ├── providers/               # TrackingProvider (Strategy): mock e AfterShip
│   ├── tracking.service.ts      # normalização e cache
│   └── tracking.controller.ts
├── jobs/                        # lotes: API, worker (consumer) e processamento
├── messaging/                   # EventPublisher (RabbitMQ ou memória) e conexão do consumer
├── prisma/ config/ common/ health/
prisma/schema.prisma + migrations/
test/
```

## 🚀 Como rodar

### Com Docker (API + PostgreSQL + RabbitMQ)

```bash
git clone https://github.com/robertofilho0/api-rastreamento.git
cd api-rastreamento
docker compose up --build
```

API em `http://localhost:3000/api`, Swagger em `http://localhost:3000/docs` e RabbitMQ em `http://localhost:15672` (guest/guest).

### Localmente

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run start:dev
```

Para usar a AfterShip, defina `TRACKING_PROVIDER=aftership` e `AFTERSHIP_API_KEY`.

## 📚 Endpoints

| Método | Rota                             | Descrição                                  |
| ------ | -------------------------------- | ------------------------------------------ |
| `GET`  | `/api/rastreio/:codigo`          | Rastreia um objeto (com cache)             |
| `GET`  | `/api/rastreio/:codigo/validar`  | Só valida o código                         |
| `POST` | `/api/lotes`                     | Agenda até 100 códigos (`202 Accepted`)    |
| `GET`  | `/api/lotes/:id`                 | Status, progresso e resultados do lote     |
| `GET`  | `/api/health`                    | Status da API e do banco                   |

```bash
curl -X POST http://localhost:3000/api/lotes -H "Content-Type: application/json" \
  -d '{"codigos":["AA123456785BR","QB473629155BR"]}'
# → 202 { "id": "…", "status": "PENDING", "total": 2, "statusUrl": "/api/lotes/…" }

curl http://localhost:3000/api/lotes/<id>
# → { "status": "DONE", "progress": 100, "processed": 2, "succeeded": 2, "resultados": [ … ] }
```

> No provedor `mock`, códigos cujos 4 últimos dígitos do número são `0000` (ex.: `AA123400004BR`) simulam objeto não encontrado.

## 🧪 Testes

```bash
npm test             # unitários (validação S10 e provedor AfterShip com fetch mockado)
npm run test:e2e     # e2e: requer DATABASE_URL; com RABBITMQ_URL processa os lotes pela fila
npm run lint
```

O CI sobe **PostgreSQL** e **RabbitMQ**, aplica as migrations, confere se elas batem com o `schema.prisma` e roda lint, testes e build.

## 📄 Licença

MIT. Veja [LICENSE](LICENSE).

---

Feito por [Roberto Filho](https://github.com/robertofilho0) · [LinkedIn](https://www.linkedin.com/in/roberto-filho-393b372b2/)
