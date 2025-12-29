from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Channel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    logo: Optional[str] = None
    group: Optional[str] = "General"
    tvg_id: Optional[str] = None
    tvg_name: Optional[str] = None
    is_radio: bool = False
    playlist_id: str

class Playlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: Optional[str] = None
    is_custom: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlaylistCreate(BaseModel):
    name: str
    url: str

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    channel_name: str
    channel_url: str
    channel_logo: Optional[str] = None
    channel_group: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoriteCreate(BaseModel):
    channel_id: str
    channel_name: str
    channel_url: str
    channel_logo: Optional[str] = None
    channel_group: Optional[str] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    player_quality: str = "auto"
    buffer_size: int = 30
    epg_url: Optional[str] = None
    parental_control: bool = False
    parental_pin: Optional[str] = None
    ui_scale: str = "normal"
    language: str = "es"

class Recording(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_name: str
    channel_url: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "scheduled"

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    type: str = "info"
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VODItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    poster: Optional[str] = None
    description: Optional[str] = None
    category: str = "Movies"
    year: Optional[int] = None
    rating: Optional[float] = None
    playlist_id: str

class SeriesItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    poster: Optional[str] = None
    description: Optional[str] = None
    seasons: int = 1
    category: str = "Drama"
    year: Optional[int] = None
    rating: Optional[float] = None
    episodes: List[dict] = []
    playlist_id: str

# ============ M3U PARSER ============

def parse_m3u(content: str, playlist_id: str) -> tuple:
    """Parse M3U content and return channels, vod items, and series"""
    channels = []
    vod_items = []
    series_items = []
    
    lines = content.strip().split('\n')
    current_item = {}
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        if line.startswith('#EXTINF:'):
            # Parse channel info
            current_item = {'playlist_id': playlist_id}
            
            # Extract attributes
            tvg_id_match = re.search(r'tvg-id="([^"]*)"', line)
            tvg_name_match = re.search(r'tvg-name="([^"]*)"', line)
            tvg_logo_match = re.search(r'tvg-logo="([^"]*)"', line)
            group_match = re.search(r'group-title="([^"]*)"', line)
            
            if tvg_id_match:
                current_item['tvg_id'] = tvg_id_match.group(1)
            if tvg_name_match:
                current_item['tvg_name'] = tvg_name_match.group(1)
            if tvg_logo_match:
                current_item['logo'] = tvg_logo_match.group(1)
            if group_match:
                current_item['group'] = group_match.group(1)
            
            # Extract name (last part after comma)
            name_match = re.search(r',(.+)$', line)
            if name_match:
                current_item['name'] = name_match.group(1).strip()
            else:
                current_item['name'] = f"Channel {len(channels) + 1}"
                
        elif line and not line.startswith('#') and current_item:
            current_item['url'] = line
            current_item['id'] = str(uuid.uuid4())
            
            group = current_item.get('group', '').lower()
            
            # Categorize based on group
            if 'radio' in group:
                current_item['is_radio'] = True
                channels.append(Channel(**current_item))
            elif 'vod' in group or 'movie' in group or 'pelicul' in group:
                vod_item = VODItem(
                    id=current_item['id'],
                    title=current_item['name'],
                    url=current_item['url'],
                    poster=current_item.get('logo'),
                    category=current_item.get('group', 'Movies'),
                    playlist_id=playlist_id
                )
                vod_items.append(vod_item)
            elif 'serie' in group:
                series_item = SeriesItem(
                    id=current_item['id'],
                    title=current_item['name'],
                    poster=current_item.get('logo'),
                    category=current_item.get('group', 'Series'),
                    episodes=[{'title': 'Episode 1', 'url': current_item['url']}],
                    playlist_id=playlist_id
                )
                series_items.append(series_item)
            else:
                current_item['is_radio'] = False
                channels.append(Channel(**current_item))
            
            current_item = {}
    
    return channels, vod_items, series_items

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "IPTV API Running", "version": "1.0.0"}

# --- Playlists ---

@api_router.get("/playlists", response_model=List[Playlist])
async def get_playlists():
    playlists = await db.playlists.find({}, {"_id": 0}).to_list(100)
    for p in playlists:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return playlists

@api_router.post("/playlists", response_model=Playlist)
async def create_playlist(data: PlaylistCreate):
    playlist = Playlist(name=data.name, url=data.url)
    
    # Fetch and parse M3U
    try:
        async with httpx.AsyncClient(timeout=30.0) as client_http:
            response = await client_http.get(data.url)
            response.raise_for_status()
            content = response.text
            
        channels, vod_items, series_items = parse_m3u(content, playlist.id)
        
        # Store playlist
        doc = playlist.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.playlists.insert_one(doc)
        
        # Store channels
        if channels:
            channel_docs = [c.model_dump() for c in channels]
            await db.channels.insert_many(channel_docs)
        
        # Store VOD items
        if vod_items:
            vod_docs = [v.model_dump() for v in vod_items]
            await db.vod.insert_many(vod_docs)
        
        # Store Series
        if series_items:
            series_docs = [s.model_dump() for s in series_items]
            await db.series.insert_many(series_docs)
        
        return playlist
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch M3U: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing playlist: {str(e)}")

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    await db.playlists.delete_one({"id": playlist_id})
    await db.channels.delete_many({"playlist_id": playlist_id})
    await db.vod.delete_many({"playlist_id": playlist_id})
    await db.series.delete_many({"playlist_id": playlist_id})
    return {"message": "Playlist deleted"}

# --- Channels ---

@api_router.get("/channels", response_model=List[Channel])
async def get_channels(group: Optional[str] = None, search: Optional[str] = None, radio: Optional[bool] = None):
    query = {}
    if group:
        query["group"] = group
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if radio is not None:
        query["is_radio"] = radio
    
    channels = await db.channels.find(query, {"_id": 0}).to_list(1000)
    return channels

@api_router.get("/channels/groups")
async def get_channel_groups():
    groups = await db.channels.distinct("group")
    return {"groups": groups}

# --- VOD ---

@api_router.get("/vod", response_model=List[VODItem])
async def get_vod(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    
    items = await db.vod.find(query, {"_id": 0}).to_list(500)
    return items

@api_router.get("/vod/categories")
async def get_vod_categories():
    categories = await db.vod.distinct("category")
    return {"categories": categories}

# --- Series ---

@api_router.get("/series", response_model=List[SeriesItem])
async def get_series(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    
    items = await db.series.find(query, {"_id": 0}).to_list(500)
    return items

@api_router.get("/series/{series_id}")
async def get_series_detail(series_id: str):
    item = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Series not found")
    return item

# --- Favorites ---

@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites():
    favorites = await db.favorites.find({}, {"_id": 0}).to_list(500)
    for f in favorites:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    return favorites

@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(data: FavoriteCreate):
    # Check if already favorite
    existing = await db.favorites.find_one({"channel_id": data.channel_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    favorite = Favorite(**data.model_dump())
    doc = favorite.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.favorites.insert_one(doc)
    return favorite

@api_router.delete("/favorites/{channel_id}")
async def remove_favorite(channel_id: str):
    result = await db.favorites.delete_one({"channel_id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# --- Settings ---

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = Settings()
        await db.settings.insert_one(settings.model_dump())
    return settings

@api_router.put("/settings", response_model=Settings)
async def update_settings(data: Settings):
    await db.settings.update_one(
        {"id": "default"},
        {"$set": data.model_dump()},
        upsert=True
    )
    return data

# --- Recordings ---

@api_router.get("/recordings", response_model=List[Recording])
async def get_recordings():
    recordings = await db.recordings.find({}, {"_id": 0}).to_list(100)
    for r in recordings:
        if isinstance(r.get('start_time'), str):
            r['start_time'] = datetime.fromisoformat(r['start_time'])
        if isinstance(r.get('end_time'), str):
            r['end_time'] = datetime.fromisoformat(r['end_time'])
    return recordings

@api_router.post("/recordings")
async def create_recording(channel_name: str, channel_url: str):
    recording = Recording(
        channel_name=channel_name,
        channel_url=channel_url,
        start_time=datetime.now(timezone.utc)
    )
    doc = recording.model_dump()
    doc['start_time'] = doc['start_time'].isoformat()
    await db.recordings.insert_one(doc)
    return recording

@api_router.delete("/recordings/{recording_id}")
async def delete_recording(recording_id: str):
    await db.recordings.delete_one({"id": recording_id})
    return {"message": "Recording deleted"}

# --- Messages ---

@api_router.get("/messages", response_model=List[Message])
async def get_messages():
    messages = await db.messages.find({}, {"_id": 0}).to_list(100)
    for m in messages:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return messages

@api_router.post("/messages/read/{message_id}")
async def mark_message_read(message_id: str):
    await db.messages.update_one({"id": message_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# --- EPG (Mock) ---

@api_router.get("/epg")
async def get_epg(channel_id: Optional[str] = None):
    # Return mock EPG data
    now = datetime.now(timezone.utc)
    programs = [
        {
            "id": "1",
            "channel_id": channel_id or "all",
            "title": "Noticias de la Mañana",
            "start": now.replace(hour=6, minute=0).isoformat(),
            "end": now.replace(hour=8, minute=0).isoformat(),
            "description": "Las noticias más importantes del día"
        },
        {
            "id": "2", 
            "channel_id": channel_id or "all",
            "title": "Película: Acción Total",
            "start": now.replace(hour=8, minute=0).isoformat(),
            "end": now.replace(hour=10, minute=0).isoformat(),
            "description": "Película de acción protagonizada por grandes estrellas"
        },
        {
            "id": "3",
            "channel_id": channel_id or "all",
            "title": "Deportes en Vivo",
            "start": now.replace(hour=10, minute=0).isoformat(),
            "end": now.replace(hour=12, minute=0).isoformat(),
            "description": "Transmisión en vivo de los mejores eventos deportivos"
        },
        {
            "id": "4",
            "channel_id": channel_id or "all",
            "title": "Serie: Drama Intenso",
            "start": now.replace(hour=12, minute=0).isoformat(),
            "end": now.replace(hour=13, minute=0).isoformat(),
            "description": "Episodio especial de la serie más vista"
        },
        {
            "id": "5",
            "channel_id": channel_id or "all",
            "title": "Documental: Naturaleza Salvaje",
            "start": now.replace(hour=13, minute=0).isoformat(),
            "end": now.replace(hour=15, minute=0).isoformat(),
            "description": "Explorando los rincones más remotos del planeta"
        }
    ]
    return {"programs": programs}

# --- App Info ---

@api_router.get("/version")
async def get_version():
    return {
        "version": "1.0.0",
        "latest": "1.0.0",
        "update_available": False,
        "release_notes": "Versión inicial de IPTV Stream"
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
