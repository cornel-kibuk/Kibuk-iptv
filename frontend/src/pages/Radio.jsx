import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Radio as RadioIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Radio() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await axios.get(`${API}/channels`, { params: { radio: true } });
      setStations(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
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
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-20 glass p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Radio</h1>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <Input
              data-testid="radio-search"
              type="text"
              placeholder="Buscar estación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
        </div>
      </header>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={selectedStation?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => toast.error("Error al reproducir la estación")}
      />

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Now Playing */}
        {selectedStation && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse-glow">
                <RadioIcon size={40} className="text-white" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-cyan-400 mb-1">Reproduciendo ahora</p>
                <h2 className="text-2xl font-bold mb-1">{selectedStation.name}</h2>
                <p className="text-white/50">{selectedStation.group || "Radio"}</p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  data-testid="play-pause-radio"
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center hover:bg-cyan-400 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={28} className="text-black" />
                  ) : (
                    <Play size={28} className="text-black ml-1" />
                  )}
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
              <button onClick={toggleMute} className="icon-btn">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <Slider
                data-testid="volume-slider"
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
              <span className="text-sm text-white/50 w-12 text-right">{isMuted ? 0 : volume}%</span>
            </div>
          </div>
        )}

        {/* Station List */}
        {filteredStations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <RadioIcon size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin estaciones de radio</h2>
            <p className="text-white/50 mb-4">
              Agrega una playlist M3U con estaciones de radio
            </p>
            <Button onClick={() => navigate("/playlists")}>
              Agregar Playlist
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredStations.map((station) => (
              <button
                key={station.id}
                data-testid={`radio-${station.id}`}
                onClick={() => handleStationSelect(station)}
                className={`glass-card p-4 flex items-center gap-4 text-left transition-all hover:border-cyan-500/50 ${
                  selectedStation?.id === station.id ? "border-cyan-500 bg-cyan-500/10" : ""
                }`}
              >
                {station.logo ? (
                  <img
                    src={station.logo}
                    alt={station.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <RadioIcon size={20} className="text-cyan-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{station.name}</h3>
                  <p className="text-sm text-white/50">{station.group || "Radio"}</p>
                </div>

                {selectedStation?.id === station.id && isPlaying && (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
