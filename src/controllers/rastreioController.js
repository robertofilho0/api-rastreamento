const rastreioService = require("../services/rastreioService");

exports.buscarEncomenda = async (req, res) => {
    try {
        const codigo = req.params.codigo;
        const resultado = await rastreioService.buscarEncomenda(codigo);

        res.json(resultado);
    } catch (error) {
        res.status(500).json({error: "Erro ao buscar rastreio"});
    }
};