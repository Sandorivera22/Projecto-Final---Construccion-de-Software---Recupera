const { Router } = require("express");
const path = require("path");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/reportes.controller");

const router = Router();
const EXTENSIONES_FOTO_PERMITIDAS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);
const uploadFoto = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		const extension = path.extname(file.originalname).toLowerCase();
		if (!EXTENSIONES_FOTO_PERMITIDAS.has(extension)) {
			return callback(new Error("Solo se permiten imágenes .jpg, .jpeg, .png, .webp o .bmp"));
		}
		callback(null, true);
	},
});

router.get("/", requireAuth, controller.listar);
router.get("/mios", requireAuth, controller.misReportes);
router.get("/buscar-semantico", requireAuth, controller.buscarSemantico);
router.get("/:id", requireAuth, controller.obtener);
router.post("/", requireAuth, controller.crear);
router.post("/:id/foto", requireAuth, uploadFoto.single("foto"), controller.subirFoto);
router.patch("/:id", requireAuth, controller.actualizar);
router.post("/:id/retirar", requireAuth, controller.retirar);
router.post("/:id/marcar-recuperado", requireAuth, controller.marcarRecuperado);

module.exports = router;
