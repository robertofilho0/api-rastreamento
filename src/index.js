const express = require("express");
const rastreioRoutes = require("./routes/rastreio");

const app = express();
app.use(express.json);

// ==== ROTAS =====

app.use("/api/rastreio", rastreioRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log(`Servidor rodando na porta ${PORT}`);
});