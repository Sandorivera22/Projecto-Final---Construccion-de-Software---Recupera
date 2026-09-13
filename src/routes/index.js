const { Router } = require("express");

const usuariosRoutes = require("./usuarios.routes");
const categoriasRoutes = require("./categorias.routes");
const reportesRoutes = require("./reportes.routes");
const reclamacionesRoutes = require("./reclamaciones.routes");

const router = Router();

router.get("/", (req, res) => res.json({ ok: true, servicio: "Recupera API" }));

router.use("/usuarios", usuariosRoutes);
router.use("/categorias", categoriasRoutes);
router.use("/reportes", reportesRoutes);
router.use("/reclamaciones", reclamacionesRoutes);

module.exports = router;
