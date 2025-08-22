const express = require("express");
const router = express.Router();
const rastreioController = require("..controllers/rastreioController");

router.get("/:codigo", rastreioController.buscarEncomenda);

module.exports = router;