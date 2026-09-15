const prisma = require("../lib/prisma");
const { z } = require("zod");
const AppError = require("../utils/AppError");

const categoriaSchema = z.object({
  nombreCategoria: z.string().trim().min(2).max(100),
});

const filtrosCategoriaSchema = z.object({
  soloActivas: z
    .enum(["true", "false"])
    .optional()
    .default("true")
    .transform((v) => v === "true"),
});

async function listar(req, res) {
  const { soloActivas } = filtrosCategoriaSchema.parse(req.query);
  const categorias = await prisma.categoriaObjeto.findMany({
    where: soloActivas ? { estado: true } : undefined,
    orderBy: { nombreCategoria: "asc" },
  });
  res.json(categorias);
}

async function crear(req, res) {
  const datos = categoriaSchema.parse(req.body);
  const categoria = await prisma.categoriaObjeto.create({ data: datos });
  res.status(201).json(categoria);
}

async function actualizar(req, res) {
  const id = Number(req.params.id);
  const datos = categoriaSchema.partial().extend({ estado: z.boolean().optional() }).parse(req.body);

  const existe = await prisma.categoriaObjeto.findUnique({ where: { idCategoriaObjeto: id } });
  if (!existe) throw new AppError("Categoría no encontrada", 404);

  const categoria = await prisma.categoriaObjeto.update({
    where: { idCategoriaObjeto: id },
    data: datos,
  });
  res.json(categoria);
}

module.exports = { listar, crear, actualizar };
