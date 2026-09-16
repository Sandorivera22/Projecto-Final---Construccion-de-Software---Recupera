import argparse
import io
import json
import os
from pathlib import Path

import httpx
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoModel, AutoProcessor


EXTENSIONES_IMAGEN = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class MotorBusquedaObjetosPerdidos:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.base_datos_vectores = np.empty((0, 0), dtype=np.float32)
        self.base_datos_rutas = []
        self.base_datos_metadatos = []

    @staticmethod
    def _tensor_embedding(features):
        """Obtiene el tensor tanto de Transformers 4 como de Transformers 5."""
        if isinstance(features, torch.Tensor):
            return features
        if hasattr(features, "pooler_output") and features.pooler_output is not None:
            return features.pooler_output
        if hasattr(features, "last_hidden_state"):
            return features.last_hidden_state[:, 0, :]
        raise TypeError("El modelo no devolvió un embedding compatible")

    def _abrir_imagen(self, origen: str) -> Image.Image:
        if origen.startswith(("http://", "https://")):
            respuesta = httpx.get(origen, timeout=30, follow_redirects=True)
            respuesta.raise_for_status()
            return Image.open(io.BytesIO(respuesta.content)).convert("RGB")

        return Image.open(origen).convert("RGB")

    def generar_embedding_imagen(self, ruta_imagen: str) -> np.ndarray:
        """Convierte una imagen en un embedding normalizado."""
        with self._abrir_imagen(ruta_imagen) as imagen_rgb:
            inputs = self.processor(images=imagen_rgb, return_tensors="pt").to(self.device)

        with torch.inference_mode():
            features = self._tensor_embedding(self.model.get_image_features(**inputs))

        features = features / features.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)
        return features.cpu().numpy().astype(np.float32)

    def generar_embedding_texto(self, texto_descripcion: str) -> np.ndarray:
        """Convierte una descripción en un embedding normalizado."""
        texto = texto_descripcion.strip()
        if not texto:
            raise ValueError("La descripción no puede estar vacía")

        inputs = self.processor(text=[texto], return_tensors="pt", padding=True).to(self.device)
        with torch.inference_mode():
            features = self._tensor_embedding(self.model.get_text_features(**inputs))

        features = features / features.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)
        return features.cpu().numpy().astype(np.float32)

    def indexar_imagenes(
        self,
        lista_rutas_imagenes: list[str],
        metadatos: list[dict] | None = None,
    ) -> int:
        """Indexa las imágenes válidas y devuelve cuántas fueron procesadas."""
        vectores = []
        rutas_validas = []
        metadatos_validos = []
        metadatos = metadatos or [{} for _ in lista_rutas_imagenes]

        for ruta, metadata in zip(lista_rutas_imagenes, metadatos):
            try:
                vector = self.generar_embedding_imagen(ruta)
            except (FileNotFoundError, UnidentifiedImageError, OSError, httpx.HTTPError) as error:
                print(f"Aviso: se omitió '{ruta}': {error}")
                continue

            vectores.append(vector)
            rutas_validas.append(ruta if ruta.startswith(("http://", "https://")) else str(Path(ruta).resolve()))
            metadatos_validos.append(metadata)

        if not vectores:
            raise ValueError("No se pudo indexar ninguna imagen válida")

        self.base_datos_rutas = rutas_validas
        self.base_datos_vectores = np.vstack(vectores)
        self.base_datos_metadatos = metadatos_validos
        return len(rutas_validas)

    def indexar_directorio(self, directorio: str, recursivo: bool = False) -> int:
        """Indexa imágenes de un directorio independiente del backend."""
        ruta_directorio = Path(directorio)
        if not ruta_directorio.is_dir():
            raise NotADirectoryError(f"No existe el directorio: {directorio}")

        archivos = ruta_directorio.rglob("*") if recursivo else ruta_directorio.glob("*")
        rutas = sorted(str(ruta) for ruta in archivos if ruta.suffix.lower() in EXTENSIONES_IMAGEN)
        if not rutas:
            raise ValueError(f"No hay imágenes compatibles en: {directorio}")
        return self.indexar_imagenes(rutas)

    def obtener_reportes_desde_supabase(self) -> list[dict]:
        """Obtiene reportes perdidos con imagen desde la API REST de Supabase."""
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_url or not service_role_key:
            raise EnvironmentError(
                "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno"
            )

        endpoint = f"{supabase_url.rstrip('/')}/rest/v1/reporte"
        parametros = {
            "select": "id_reporte,tipo,nombre_objeto,descripcion_objeto,lugar_campus,estado,url_foto",
            "tipo": "eq.perdido",
            "estado": "neq.retirado",
            "url_foto": "not.is.null",
            "order": "creado_en.desc",
        }
        respuesta = httpx.get(
            endpoint,
            params=parametros,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
            },
            timeout=30,
        )
        respuesta.raise_for_status()
        return respuesta.json()

    def indexar_reportes_desde_supabase(self) -> int:
        """Indexa los objetos perdidos con URL de imagen registrados en Supabase."""
        reportes = self.obtener_reportes_desde_supabase()
        if not reportes:
            raise ValueError("No hay reportes perdidos con imagen en la base de datos")

        rutas = [reporte["url_foto"] for reporte in reportes]
        return self.indexar_imagenes(rutas, reportes)

    def guardar_indice(self, ruta_indice: str) -> None:
        """Guarda embeddings y rutas para evitar reindexar en cada búsqueda."""
        if not self.base_datos_rutas:
            raise ValueError("No hay imágenes indexadas para guardar")
        np.savez_compressed(
            ruta_indice,
            vectores=self.base_datos_vectores,
            rutas=np.array(self.base_datos_rutas, dtype=str),
            metadatos=np.array(json.dumps(self.base_datos_metadatos, ensure_ascii=False), dtype=str),
        )

    def cargar_indice(self, ruta_indice: str) -> int:
        """Carga un índice previamente guardado y devuelve su cantidad de imágenes."""
        with np.load(ruta_indice, allow_pickle=False) as indice:
            self.base_datos_vectores = indice["vectores"].astype(np.float32)
            self.base_datos_rutas = indice["rutas"].tolist()
            self.base_datos_metadatos = json.loads(str(indice["metadatos"])) if "metadatos" in indice else []

        if self.base_datos_vectores.ndim != 2 or len(self.base_datos_rutas) == 0:
            raise ValueError("El archivo de índice está vacío o es inválido")
        if self.base_datos_vectores.shape[0] != len(self.base_datos_rutas):
            raise ValueError("El índice tiene cantidades distintas de vectores y rutas")
        if not self.base_datos_metadatos:
            self.base_datos_metadatos = [{} for _ in self.base_datos_rutas]
        if len(self.base_datos_metadatos) != len(self.base_datos_rutas):
            raise ValueError("El índice tiene cantidades distintas de vectores y metadatos")
        return len(self.base_datos_rutas)

    def buscar(
        self,
        descripcion_vaga: str,
        umbral_minimo: float = 0.0,
        top_k: int = 5,
    ) -> list[dict]:
        """Devuelve las imágenes más parecidas a la descripción, ordenadas."""
        if not self.base_datos_rutas:
            raise ValueError("Primero debes indexar o cargar imágenes")
        if top_k < 1:
            raise ValueError("top_k debe ser mayor que cero")

        vector_texto = self.generar_embedding_texto(descripcion_vaga)
        similitudes = cosine_similarity(vector_texto, self.base_datos_vectores)[0]
        resultados = [
            {
                **self.base_datos_metadatos[idx],
                "imagen": self.base_datos_rutas[idx],
                "similitud_porcentaje": round(float(score) * 100, 2),
            }
            for idx, score in enumerate(similitudes)
            if float(score) * 100 >= umbral_minimo
        ]
        return sorted(resultados, key=lambda resultado: resultado["similitud_porcentaje"], reverse=True)[:top_k]


def construir_argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Búsqueda experimental de objetos perdidos con CLIP")
    origen = parser.add_mutually_exclusive_group(required=True)
    origen.add_argument("--imagenes", help="Directorio independiente con imágenes de objetos")
    origen.add_argument("--desde-bd", action="store_true", help="Usar reportes perdidos con imagen desde Supabase")
    parser.add_argument("--consulta", required=True, help="Descripción del objeto que se está buscando")
    parser.add_argument("--indice", default="indice_objetos.npz", help="Archivo local para guardar o reutilizar el índice")
    parser.add_argument("--top-k", type=int, default=5, help="Cantidad máxima de resultados")
    parser.add_argument("--umbral", type=float, default=0.0, help="Similitud mínima en porcentaje")
    parser.add_argument("--recursivo", action="store_true", help="Buscar imágenes también en subdirectorios")
    parser.add_argument("--reindexar", action="store_true", help="Ignorar el índice guardado y procesar las imágenes de nuevo")
    return parser.parse_args()


def main() -> None:
    argumentos = construir_argumentos()
    motor = MotorBusquedaObjetosPerdidos()
    ruta_indice = Path(argumentos.indice)

    if ruta_indice.exists() and not argumentos.reindexar:
        cantidad = motor.cargar_indice(str(ruta_indice))
        print(f"Índice cargado: {cantidad} imágenes")
    elif argumentos.desde_bd:
        cantidad = motor.indexar_reportes_desde_supabase()
        motor.guardar_indice(str(ruta_indice))
        print(f"Índice creado desde Supabase: {cantidad} imágenes")
    else:
        cantidad = motor.indexar_directorio(argumentos.imagenes, argumentos.recursivo)
        motor.guardar_indice(str(ruta_indice))
        print(f"Índice creado: {cantidad} imágenes")

    resultados = motor.buscar(argumentos.consulta, argumentos.umbral, argumentos.top_k)
    print(json.dumps(resultados, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()