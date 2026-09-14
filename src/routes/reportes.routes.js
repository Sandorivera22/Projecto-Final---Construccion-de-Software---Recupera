const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/reportes.controller");

const router = Router();

router.get("/", requireAuth, controller.listar);
router.get("/mios", requireAuth, controller.misReportes);
router.get("/:id", requireAuth, controller.obtener);
router.post("/", requireAuth, controller.crear);
router.patch("/:id", requireAuth, controller.actualizar);
router.post("/:id/retirar", requireAuth, controller.retirar);
router.post("/:id/marcar-recuperado", requireAuth, controller.marcarRecuperado);

module.exports = router;
