import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

dotenv.config();

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
import cartRouter from "./routes/cart.js";

const app = express();

app.use(cors());
app.use(express.json());

const uploadsPath = path.join(rootDir, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

app.use("/api/health", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);     
app.use("/api/events", eventsRouter);   
app.use("/api/orders", ordersRouter);   
app.use("/api/logs", logsRouter);       
app.use("/api/pix", pixRouter);         
app.use("/api/cart", cartRouter);         

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`Servindo uploads a partir de: ${uploadsPath}`);
});
