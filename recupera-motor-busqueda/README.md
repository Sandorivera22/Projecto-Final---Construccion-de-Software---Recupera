# Recupera — Motor de Búsqueda Semántica 

Microservicio en que indexa fotos de reportes como vectores
CLIP y permite buscarlos con una descripción en texto libre ("un bolso
oscuro que se ve viejito"). Vive en la misma base de Postgres que el
backend de Node (Supabase), usando **pgvector** — no hace falta una base de
datos vectorial aparte.

