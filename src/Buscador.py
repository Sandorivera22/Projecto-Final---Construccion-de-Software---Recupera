import torch
from PIL import Image
from transformers import AutoProcessor, AutoModel
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class MotorBusquedaObjetosPerdidos:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        # Cargar el procesador y el modelo CLIP en memoria
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        
        self.base_datos_vectores = []
        self.base_datos_rutas = []

    def generar_embedding_imagen(self, ruta_imagen: str):
        """Convierte una imagen de la base de datos en un vector embedding."""
        imagen = Image.open(ruta_imagen).convert("RGB")
        inputs = self.processor(images=imagen, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
            
        # Normalizar el vector
        features = features / features.norm(p=2, dim=-1, keepdim=True)
        return features.cpu().numpy()

    def generar_embedding_texto(self, texto_descripcion: str):
        """Convierte la descripción en lenguaje natural en un vector embedding."""
        inputs = self.processor(text=[texto_descripcion], return_tensors="pt", padding=True).to(self.device)
        
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
            
        # Normalizar el vector
        features = features / features.norm(p=2, dim=-1, keepdim=True)
        return features.cpu().numpy()

    def indexar_imagenes(self, lista_rutas_imagenes: list[str]):
        """Procesa e indexa todas las imágenes registradas en la base de datos."""
        self.base_datos_rutas = lista_rutas_imagenes
        self.base_datos_vectores = []
        
        for ruta in lista_rutas_imagenes:
            vector = self.generar_embedding_imagen(ruta)
            self.base_datos_vectores.append(vector)
            
        self.base_datos_vectores = np.vstack(self.base_datos_vectores)

    def buscar(self, descripcion_vaga: str, umbral_minimo: float = 0.0) -> list[dict]:
        """Compara la descripción en texto contra las imágenes y devuelve coincidencias con % de similitud."""
        vector_texto = self.generar_embedding_texto(descripcion_vaga)
        
        # Similitud coseno entre la consulta de texto y todas las imágenes indexadas
        similitudes = cosine_similarity(vector_texto, self.base_datos_vectores)[0]
        
        resultados = []
        for idx, score in enumerate(similitudes):
            porcentaje = float(score) * 100
            if porcentaje >= umbral_minimo:
                resultados.append({
                    "imagen": self.base_datos_rutas[idx],
                    "similitud_porcentaje": round(porcentaje, 2)
                })
        
        # Ordenar los resultados del más similar al menos similar
        resultados.sort(key=lambda x: x["similitud_porcentaje"], reverse=True)
        return resultados

# ==========================================
# Ejemplo de uso práctico:
# ==========================================
if __name__ == "__main__":
    motor = MotorBusquedaObjetosPerdidos()

    # 1. Rutas de imágenes simuladas registradas en el sistema de objetos perdidos
    imagenes_registradas = [
        "mochila_negra_gastada.jpg",
        "llaves_con_llavero_azul.jpg",
        "tarjeta_bancaria_dorada.jpg",
        "cuaderno_rojo_espiral.jpg"
    ]

    # 2. Indexación inicial (Se ejecuta al arrancar el servicio o guardar una imagen)
    # motor.indexar_imagenes(imagenes_registradas)

    # 3. Ejemplo de búsqueda con descripción vaga de un usuario
    descripcion_usuario = "un bolso oscuro que se ve viejito para llevar libros"
    
    # resultados = motor.buscar(descripcion_usuario)
    # print(resultados)