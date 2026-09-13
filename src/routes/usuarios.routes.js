const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/usuarios.controller");

const router = Router();

// Perfil propio
router.get("/me", requireAuth, controller.miPerfil);
router.patch("/me", requireAuth, controller.actualizarMiPerfil);

// Administración (solo admin)
router.get("/", requireAuth, requireRole("admin"), controller.listar);
router.get("/:id", requireAuth, requireRole("admin"), controller.obtener);
router.patch("/:id/rol", requireAuth, requireRole("admin"), controller.cambiarRol);
router.patch("/:id/estado", requireAuth, requireRole("admin"), controller.cambiarEstado);

module.exports = router;
