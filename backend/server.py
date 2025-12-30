from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from urllib.parse import urlparse

app = FastAPI()

# Permite que el frontend (React) se comunique con este backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen (ideal para desarrollo)
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lista de canales por país (puedes añadir más)
CHANNELS = {
    "es": "https://raw.githubusercontent.com/iptv-org/iptv/master/channels/es.m3u",
    "us": "https://raw.githubusercontent.com/iptv-org/iptv/master/channels/us.m3u",
    "uk": "https://raw.githubusercontent.com/iptv-org/iptv/master/channels/uk.m3u",
    "de": "https://raw.githubusercontent.com/iptv-org/iptv/master/channels/de.m3u",
}

@app.get("/")
def home():
    return {"message": "Kibuk IPTV Backend - Funcionando sin MongoDB"}

@app.get("/channels/{country}")
def get_channels_by_country(country: str):
    """
    Devuelve la lista M3U de un país.
    Ejemplo: /channels/es → canales en español
    """
    if country not in CHANNELS:
        return {"error": "País no soportado. Usa: es, us, uk, de"}
    
    url = CHANNELS[country]
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return {"m3u_content": response.text}
        else:
            return {"error": f"No se pudo cargar la lista. Código: {response.status_code}"}
    except Exception as e:
        return {"error": f"Error al conectar: {str(e)}"}

@app.get("/playlist")
def get_custom_playlist(url: str):
    """
    Carga una playlist M3U desde cualquier URL (útil para listas personalizadas).
    Ejemplo: /playlist?url=https://midominio.com/lista.m3u
    """
    # Validación básica de URL
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return {"error": "URL inválida"}
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return {"m3u_content": response.text}
        else:
            return {"error": f"No se pudo cargar la lista. Código: {response.status_code}"}
    except Exception as e:
        return {"error": f"Error al conectar: {str(e)}"}