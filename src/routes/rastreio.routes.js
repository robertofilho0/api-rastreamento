const { Router } = require('express');
const controller = require('../controllers/rastreio.controller');
const validate = require('../middlewares/validate');
const schemas = require('../validators/rastreio.validator');

const router = Router();

router.post('/lote', validate({ body: schemas.lote }), controller.lote);
router.get('/:codigo/validar', controller.validar);
router.get('/:codigo', validate({ params: schemas.params }), controller.buscar);

module.exports = router;
