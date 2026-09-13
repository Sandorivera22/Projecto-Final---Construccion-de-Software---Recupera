const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/reclamaciones.controller");
const mensajesController = require("../controllers/mensajes.controller");

const router = Router();

router.post("/", requireAuth, controller.crear);
router.get("/mias", requireAuth, controller.misReclamaciones);
router.get("/", requireAuth, requireRole("encargado", "admin"), controller.listar);
router.get("/:id", requireAuth, controller.obtener);
router.post("/:id/evaluacion", requireAuth, requireRole("encargado", "admin"), controller.evaluar);

// Mensajería dentro de una reclamación
router.get("/:idReclamacion/mensajes", requireAuth, mensajesController.listar);
router.post("/:idReclamacion/mensajes", requireAuth, mensajesController.crear);

module.exports = router;
