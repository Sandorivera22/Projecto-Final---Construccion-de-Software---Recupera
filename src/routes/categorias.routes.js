const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/categorias.controller");

const router = Router();

router.get("/", requireAuth, controller.listar);
router.post("/", requireAuth, requireRole("admin"), controller.crear);
router.patch("/:id", requireAuth, requireRole("admin"), controller.actualizar);

module.exports = router;
