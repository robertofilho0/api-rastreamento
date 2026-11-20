# 📦 API de Rastreamento de Encomendas

[![CI](https://github.com/robertofilho0/api-rastreamento/actions/workflows/ci.yml/badge.svg)](https://github.com/robertofilho0/api-rastreamento/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-5-000000?logo=express)
![License](https://img.shields.io/badge/license-MIT-blue)

API REST para rastrear encomendas com **validação do código no padrão S10 dos Correios** (incluindo o dígito verificador), **provedores plugáveis**, **cache em memória** e **consulta em lote**.

## ✨ Funcionalidades

- **Validação real do código de rastreio**: formato `AA123456785BR` e cálculo do dígito verificador (pesos 8-6-4-2-3-5-9-7, módulo 11). Códigos inválidos são barrados antes de qualquer chamada externa.
- **Provedores plugáveis** (padrão _Strategy_):
  - `mock` (padrão): histórico simulado e **determinístico**, ideal para desenvolvimento e demonstrações
  - `aftership`: integração real com a [AfterShip](https://www.aftership.com/) (Correios e +1000 transportadoras)
- **Resposta normalizada**, independente do provedor: status padronizado, flag `entregue`, última atualização e eventos ordenados
- **Cache com TTL** e header `X-Cache: HIT | MISS`
- **Consulta em lote** de até 20 códigos em paralelo, com remoção de duplicados e falhas isoladas por código
- Timeout nas chamadas externas, com erros convertidos em `502`/`504`
- Validação com **Zod**, **Helmet**, **CORS**, **rate limiting**, health check e **Swagger UI** em `/docs`
- **Testes** com Jest + Supertest, incluindo o provedor AfterShip com `fetch` mockado
- Sem dependência de HTTP client: usa o `fetch` nativo do Node 22

## 🧱 Stack

Node.js 22+ · Express 5 · Zod · Jest · Supertest · ESLint · Prettier · Docker

## 📁 Estrutura

```
src/
├── app.js / server.js
├── config/env.js            # configuração validada
├── providers/
│   ├── index.js             # escolhe o provedor pelo TRACKING_PROVIDER
│   ├── mock.provider.js
│   └── aftership.provider.js
├── services/rastreio.service.js  # cache, normalização e consulta em lote
├── utils/
│   ├── codigoRastreio.js    # validação S10 e dígito verificador
│   └── TtlCache.js
├── controllers/ routes/ validators/ middlewares/
└── docs/openapi.json
tests/
```

## 🚀 Como rodar

```bash
git clone https://github.com/robertofilho0/api-rastreamento.git
cd api-rastreamento
npm install
cp .env.example .env
npm run dev
```

Ou com Docker: `docker compose up --build`.

A API sobe em `http://localhost:3000` e a documentação em `http://localhost:3000/docs`.

### Usando a AfterShip

Crie uma conta gratuita, gere uma API key e configure o `.env`:

```env
TRACKING_PROVIDER=aftership
AFTERSHIP_API_KEY=sua_chave
```

| Variável              | Padrão | Descrição                                   |
| --------------------- | ------ | ------------------------------------------- |
| `PORT`                | `3000` | Porta HTTP                                  |
| `TRACKING_PROVIDER`   | `mock` | `mock` ou `aftership`                       |
| `AFTERSHIP_API_KEY`   | —      | Obrigatória quando o provedor é `aftership` |
| `PROVIDER_TIMEOUT_MS` | `5000` | Timeout da chamada externa                  |
| `CACHE_TTL_SECONDS`   | `300`  | Tempo de cache (0 desativa)                 |

## 📚 Endpoints

| Método | Rota                            | Descrição                             |
| ------ | ------------------------------- | ------------------------------------- |
| `GET`  | `/api/rastreio/:codigo`         | Rastreia um objeto                    |
| `POST` | `/api/rastreio/lote`            | Rastreia até 20 objetos               |
| `GET`  | `/api/rastreio/:codigo/validar` | Só valida o código (formato e dígito) |
| `GET`  | `/health`                       | Status e provedor ativo               |

### Exemplos

```bash
curl http://localhost:3000/api/rastreio/AA123456785BR
```

```json
{
  "codigo": "AA123456785BR",
  "transportadora": "Correios (simulado)",
  "status": "em_transito",
  "descricao": "Objeto em trânsito - por favor aguarde",
  "entregue": false,
  "ultimaAtualizacao": "2026-11-19T14:00:00.000Z",
  "eventos": [
    {
      "data": "2026-11-19T14:00:00.000Z",
      "local": "Recife/PE",
      "status": "em_transito",
      "descricao": "Objeto em trânsito - por favor aguarde"
    },
    {
      "data": "2026-11-18T10:00:00.000Z",
      "local": "São Paulo/SP",
      "status": "postado",
      "descricao": "Objeto postado"
    }
  ]
}
```

```bash
curl -X POST http://localhost:3000/api/rastreio/lote \
  -H "Content-Type: application/json" \
  -d '{"codigos":["AA123456785BR","QB473629155BR"]}'
```

Código com dígito verificador errado:

```json
{
  "error": "Dados inválidos",
  "details": [{ "campo": "codigo", "mensagem": "Dígito verificador inválido" }]
}
```

> No provedor `mock`, códigos cujos últimos 4 dígitos do número são `0000` (ex.: `AA123400005BR`) simulam um objeto não encontrado.

## 🧪 Testes

```bash
npm test
npm run test:coverage
npm run lint
```

## 📄 Licença

MIT. Veja [LICENSE](LICENSE).

---

Feito por [Roberto Filho](https://github.com/robertofilho0) · [LinkedIn](https://www.linkedin.com/in/roberto-filho-393b372b2/)
