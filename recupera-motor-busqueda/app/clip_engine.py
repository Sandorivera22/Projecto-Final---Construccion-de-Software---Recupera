"""
Motor de embeddings CLIP.

Diferencia clave respecto al script original: esta versión NO mantiene una
lista en memoria (self.base_datos_vectores) — eso se pierde cada vez que el
proceso se reinicia. En su lugar, cada método simplemente devuelve el vector;
quien lo llama (main.py) decide qué hacer con él: guardarlo en Postgres
(pgvector) o compararlo contra lo que ya está guardado ahí.

El modelo se carga UNA sola vez al iniciar el servicio (ver main.py, evento
de startup) y se reutiliza en cada request — cargarlo por request sería
lentísimo (son ~600MB y unos segundos de carga).
"""
import io

import numpy as np
import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"  # 512 dimensiones
DIMENSION_ESPERADA = 512


class MotorEmbeddingsCLIP:
    def __init__(self, model_name: str = MODEL_NAME):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.model_name = model_name

    def _normalizar(self, features: torch.Tensor) -> np.ndarray:
        features = features / features.norm(p=2, dim=-1, keepdim=True)
        vector = features.cpu().numpy()[0]  # vector 1D de 512 posiciones
        # Aserción defensiva: get_image_features()/get_text_features() ya
        # devuelven el embedding proyectado (512 dim para ViT-B/32), no el
        # pooler_output crudo (768 dim). Si algún día cambia el modelo o la
        # versión de transformers altera este comportamiento, falla ruidoso
        # aquí en vez de guardar silenciosamente un vector de otra dimensión
        # en una columna vector(512) — eso pgvector lo rechazaría igual, pero
        # mejor un mensaje claro que un error críptico de la base de datos.
        if vector.shape[0] != DIMENSION_ESPERADA:
            raise ValueError(
                f"El modelo '{self.model_name}' devolvió un embedding de "
                f"{vector.shape[0]} dimensiones, se esperaban {DIMENSION_ESPERADA}. "
                "Revisa si cambió la versión de transformers o el modelo."
            )
        return vector

    def embedding_de_imagen_bytes(self, contenido_imagen: bytes) -> np.ndarray:
        """Genera el embedding a partir de los bytes crudos de una imagen
        (ya descargada de Supabase Storage, no de un path local)."""
        imagen = Image.open(io.BytesIO(contenido_imagen)).convert("RGB")
        inputs = self.processor(images=imagen, return_tensors="pt").to(self.device)
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
        return self._normalizar(features)

    def embedding_de_texto(self, texto: str) -> np.ndarray:
        inputs = self.processor(
            text=[texto], return_tensors="pt", padding=True, truncation=True
        ).to(self.device)
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
        return self._normalizar(features)
