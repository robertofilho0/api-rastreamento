# 📦 API de Rastreamento de Encomendas - Node.js + Express

API para rastrear encomendas de diferentes transportadoras, permitindo consultar o status atual, histórico de movimentações e últimas atualizações.  
O projeto tem como objetivo demonstrar **integração com APIs externas de rastreamento** (ex: Correios, AfterShip, Melhor Envio), além de boas práticas no desenvolvimento de APIs REST.

## 📌 Ajustes e melhorias
O projeto ainda está em desenvolvimento e as próximas atualizações serão voltadas para as seguintes tarefas:

- [x] Estrutura inicial da API com **Node.js + Express**  
- [x] Endpoint de rastreamento com mock (dados fictícios)  
- [ ] Integração real com APIs externas (**Correios**, **AfterShip** ou **Melhor Envio**)  
- [ ] Persistência em banco de dados (**MongoDB**) para histórico  
- [ ] Autenticação via **JWT**  
- [ ] Documentação com Swagger/OpenAPI  
- [ ] Testes automatizados  

---

## 💻 Pré-requisitos
Antes de começar, verifique se você possui instalado em sua máquina:

- **Node.js** 20.x ou superior  
- **npm** ou **yarn**  

Compatível com **Windows**, **Linux** e **macOS**

---

## 🚀 Instalando a API de Rastreamento

**1. Clone o repositório:**

```bash
git clone https://github.com/RobertoTheDev/api-rastreio.git
cd api-rastreio
```
**2. Instale as dependências:**
```bash
npm install
```
**3. Configure o arquivo .env:**
```bash
PORT=3000

# Caso use AfterShip
AFTERSHIP_API_KEY=sua_chave_api_aqui

# Caso use Melhor Envio
MELHORENVIO_API_KEY=sua_chave_api_aqui
```
**4. Inicie o servidor local:**
```bash
npm run dev
```

## 📡 Endpoints da API:

**📦 Rastreamento (/api/rastreio)**

| Método | Endpoint            | Auth | Descrição                           |
| ------ | ------------------- | ---- | ----------------------------------- |
| GET    | /api/rastreio/:codigo   | ❌    | Retorna status de uma encomenda              |

### ☕ Exemplos curl:
**Rastrear encomenda (mock):**

```bash
curl -X GET http://localhost:3000/api/rastreio/AA123456BR
```
**Resposta esperada (mock):**

```json
{
  "codigo": "AA123456BR",
  "status": "Em trânsito",
  "ultimaAtualizacao": "2025-08-20 14:33",
  "historico": [
    { "data": "2025-08-18", "local": "São Paulo/SP", "status": "Objeto postado" },
    { "data": "2025-08-19", "local": "Curitiba/PR", "status": "Em trânsito" }
  ]
}
```

## 🔗 Integração com APIs Externas:
🔗 Integração com APIs Externas

Esta API pode se conectar a diferentes serviços de rastreamento:

**Correios (SIGEP / SRO)** → oficial, mas exige contrato e integração via SOAP.

**AfterShip**
 → suporte a +900 transportadoras (inclui Correios). Plano gratuito até 50 rastreamentos/mês.

**Melhor Envio**
 → API brasileira de fretes que permite rastreamento de múltiplos transportadores (inclui Correios).

Por padrão, o projeto inicia com **dados mockados.**
Para usar integração real, configure sua **API_KEY** no .env e ajuste o serviço em services/rastreioService.js.

## 🛠 Tecnologias utilizadas:


- **Node.js** 20.x

- **Express**

- **Axios** (requisições HTTP)

- **Nodemon** (ambiente de desenvolvimento)

- **MongoDB** (opcional, para persistência futura)
