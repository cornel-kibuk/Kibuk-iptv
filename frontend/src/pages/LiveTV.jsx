import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  List,
  Grid,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export default function LiveTV() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    // Cargar lista M3U directamente desde iptv-org
    const m3uRes = await fetch("https://iptv-org.github.io/iptv/channels/es.m3u");
    const m3uText = await m3uRes.text();
    
    // Parsear el archivo M3U
    const lines = m3uText.split("\n");
    const parsedChannels = [];
    let currentChannel = null;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        // Extrae el nombre del canal
        const name = line.includes(",") ? line.split(",").pop() : "Canal";
        // Extrae el grupo si existe
        let group = "General";
        const groupMatch = line.match(/group-title="([^"]*)"/);
        if (groupMatch && groupMatch[1]) {
          group = groupMatch[1];
        }
        currentChannel = { name: name.trim(), url: "", group, logo: "" };
      } else if (line.startsWith("http") && currentChannel) {
        currentChannel.url = line;
        parsedChannels.push({ ...currentChannel, id: parsedChannels.length + 1 });
        currentChannel = null;
      }
    }

    setChannels(parsedChannels);
    const uniqueGroups = [...new Set(parsedChannels.map(c => c.group))];
    setGroups(uniqueGroups);
    if (parsedChannels.length > 0) {
      setSelectedChannel(parsedChannels[0]);
    }
  } catch (error) {
    console.error("Error al cargar canales:", error);
    toast.error("Error al cargar canales");
  } finally {
    setLoading(false);
  }
};

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === "all" || channel.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleFavorite = (channel) => {
  let currentFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (currentFavorites.includes(channel.id)) {
    currentFavorites = currentFavorites.filter(id => id !== channel.id);
    toast.success("Eliminado de favoritos");
  } else {
    currentFavorites.push(channel.id);
    toast.success("Añadido a favoritos");
  }
  localStorage.setItem("favorites", JSON.stringify(currentFavorites));
  setFavorites(currentFavorites);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 flex">
      {/* Sidebar - Channel List */}
      <aside className="channel-sidebar flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">Live TV</h2>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <Input
              data-testid="channel-search"
              type="text"
              placeholder="Buscar canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {/* Group Filter & View Toggle */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between bg-white/5 border-white/10">
                  <span className="truncate">
                    {selectedGroup === "all" ? "Todos los grupos" : selectedGroup}
                  </span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-white/10">
                <DropdownMenuItem onClick={() => setSelectedGroup("all")}>
                  Todos los grupos
                </DropdownMenuItem>
                {groups.map((group) => (
                  <DropdownMenuItem key={group} onClick={() => setSelectedGroup(group)}>
                    {group}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="icon-btn"
            >
              {viewMode === "list" ? <Grid size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Channel List */}
        <ScrollArea className="flex-1">
          <div className={`p-3 ${viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-1"}`}>
            {filteredChannels.length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-white/50 text-sm">No hay canales</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/playlists")}
                >
                  Agregar Playlist
                </Button>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  data-testid={`channel-${channel.id}`}
                  onClick={() => handleChannelSelect(channel)}
                  className={`channel-item flex items-center gap-3 cursor-pointer ${
                    selectedChannel?.id === channel.id ? "active" : ""
                  }`}
                >
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-10 h-10 rounded-lg object-cover bg-white/5"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Play size={16} className="text-cyan-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{channel.name}</p>
                    <p className="text-xs text-white/40 truncate">{channel.group}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(channel); }}
                    className="icon-btn"
                  >
                    <Star
                      size={16}
                      className={favorites.includes(channel.id) ? "text-yellow-400 fill-yellow-400" : "text-white/40"}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content - Video Player */}
      <main className="flex-1 flex flex-col p-4 md:p-6">
        {selectedChannel ? (
          <>
            {/* Video Container */}
            <div className="video-player flex-1 relative">
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                src={selectedChannel.url}
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => toast.error("Error al reproducir el canal")}
              />
              
              {/* Player Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 player-controls opacity-0 hover:opacity-100 transition-opacity">
                <button
                  data-testid="play-pause-btn"
                  onClick={togglePlay}
                  className="player-btn"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "0%" }} />
                </div>

                <button
                  data-testid="mute-btn"
                  onClick={toggleMute}
                  className="player-btn"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <button
                  data-testid="fullscreen-btn"
                  onClick={toggleFullscreen}
                  className="player-btn"
                >
                  <Maximize size={24} />
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{selectedChannel.name}</h1>
                <p className="text-sm text-white/50">{selectedChannel.group}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => toggleFavorite(selectedChannel)}
                className="gap-2"
              >
                <Star
                  size={18}
                  className={favorites.includes(selectedChannel.id) ? "text-yellow-400 fill-yellow-400" : ""}
                />
                {favorites.includes(selectedChannel.id) ? "En Favoritos" : "Añadir"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Play size={40} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Sin canal seleccionado</h2>
              <p className="text-white/50">Selecciona un canal de la lista para comenzar</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
