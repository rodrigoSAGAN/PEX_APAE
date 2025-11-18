import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Log pra ver se o token foi lido
console.log(
  "MP_ACCESS_TOKEN carregado?",
  process.env.MP_ACCESS_TOKEN ? "SIM" : "NÃO"
);

import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import usersRouter from "./routes/users.js";    
import eventsRouter from "./routes/events.js";  
import ordersRouter from "./routes/orders.js";  
import logsRouter from "./routes/logs.js";      
import pixRouter from "./routes/pix.js";

const app = express();

//Middlewares globais
app.use(cors());
app.use(express.json());

const uploadsPath = path.join(rootDir, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Rotas da API
app.use("/api/health", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);     
app.use("/api/events", eventsRouter);   
app.use("/api/orders", ordersRouter);   
app.use("/api/logs", logsRouter);       
app.use("/api/pix", pixRouter);         

// Inicia o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`Servindo uploads a partir de: ${uploadsPath}`);
});
