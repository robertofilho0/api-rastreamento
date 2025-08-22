const axios = require("axios");

exports.buscarEncomenda = async (codigo) => {
    const url = `#` // URL DA API EXTERNA

    const response = await axios.get(url);

    return response.data;
};