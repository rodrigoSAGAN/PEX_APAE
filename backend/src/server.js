// =============================================================================
// Arquivo principal do servidor backend da APAE Pinhão.
// Aqui é onde tudo começa: configuramos o Express, registramos todas as rotas
// e subimos o servidor. Se você precisa adicionar uma nova rota, é aqui que
// ela deve ser importada e registrada.
// =============================================================================

import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Importação de todas as rotas — cada arquivo cuida de uma parte do sistema.
import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import usersRouter from "./routes/users.js";
import eventsRouter from "./routes/events.js";
import ordersRouter from "./routes/orders.js";
import logsRouter from "./routes/logs.js";
import pixRouter from "./routes/pix.js";
import cartRouter from "./routes/cart.js";
import salesRouter from "./routes/salesRoutes.js";
import webhookRouter from "./routes/webhook.js";
import paymentsRouter from "./routes/payments.js";

// No ESM (módulos modernos do JS), __dirname e __filename não existem por padrão.
// Precisamos recriá-los manualmente pra trabalhar com caminhos de arquivo.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

// Carrega as variáveis de ambiente do .env (chaves do Mercado Pago, Firebase, etc.)
dotenv.config();

console.log(
  "MP_ACCESS_TOKEN carregado?",
  process.env.MP_ACCESS_TOKEN ? "SIM" : "NÃO"
);

const app = express();

// Libera o CORS pra que o frontend consiga fazer requisições sem ser bloqueado.
app.use(cors());

// IMPORTANTE: O webhook fica ANTES do express.json() porque ele precisa do body
// "cru" (raw) pra validar a assinatura de segurança do Mercado Pago.
app.use("/webhook", webhookRouter);

// A partir daqui, todas as outras rotas usam JSON normalmente.
app.use(express.json());

// Serve imagens de produtos e outros uploads como arquivos estáticos.
const uploadsPath = path.join(rootDir, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

// Registro de todas as rotas da API — cada uma cuida de um domínio do sistema.
app.use("/api/health", healthRouter);       // Verificação de saúde do servidor
app.use("/api/products", productsRouter);   // CRUD de produtos da loja
app.use("/api/users", usersRouter);         // Gestão de usuários e permissões
app.use("/api/events", eventsRouter);       // CRUD de eventos + reservas
app.use("/api/orders", ordersRouter);       // Pedidos (criar, listar, resumo)
app.use("/api/logs", logsRouter);           // Logs de auditoria
app.use("/api/pix", pixRouter);             // Geração de pagamentos PIX
app.use("/api/cart", cartRouter);           // Carrinho de compras
app.use("/api/sales", salesRouter);         // Relatórios de vendas
app.use("/api/payments", paymentsRouter);   // Status de pagamento

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`Servindo uploads a partir de: ${uploadsPath}`);
});
