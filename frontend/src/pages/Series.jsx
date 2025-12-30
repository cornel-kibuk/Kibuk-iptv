import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Play,
  Clapperboard,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const placeholderImages = [
  "https://images.unsplash.com/photo-1659835347242-97835d671db7?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  "https://images.unsplash.com/photo-1718547719429-fdd74a231fa8?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
];

export default function Series() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [series, setSeries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await axios.get(`${API}/series`);
      setSeries(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeries = series.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSeriesClick = (item) => {
    setSelectedSeries(item);
  };

  const handleEpisodePlay = (episode) => {
    setSelectedEpisode(episode);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setSelectedEpisode(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const closeSeriesDetail = () => {
    setSelectedSeries(null);
  };

  const getPlaceholderImage = (index) => {
    return placeholderImages[index % placeholderImages.length];
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Series</h1>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <Input
              data-testid="series-search"
              type="text"
              placeholder="Buscar serie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {filteredSeries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clapperboard size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin series disponibles</h2>
            <p className="text-white/50 mb-4">
              Agrega una playlist M3U con series
            </p>
            <Button onClick={() => navigate("/playlists")}>
              Agregar Playlist
            </Button>
          </div>
        ) : (
          <div className="content-grid">
            {filteredSeries.map((item, index) => (
              <div
                key={item.id}
                data-testid={`series-${item.id}`}
                className="media-card group cursor-pointer"
                onClick={() => handleSeriesClick(item)}
              >
                <img
                  src={item.poster || getPlaceholderImage(index)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getPlaceholderImage(index); }}
                />
                <div className="media-card-overlay">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-white/50">
                    {item.seasons} temporada{item.seasons !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={40} className="text-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Series Detail Modal */}
      <Dialog open={!!selectedSeries && !isPlaying} onOpenChange={closeSeriesDetail}>
        <DialogContent className="max-w-2xl bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedSeries?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-4">
            <img
              src={selectedSeries?.poster || getPlaceholderImage(0)}
              alt={selectedSeries?.title}
              className="w-40 h-60 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-4">
                {selectedSeries?.description || "Sin descripción disponible"}
              </p>
              <div className="flex gap-3 text-sm text-white/50">
                {selectedSeries?.year && <span>{selectedSeries.year}</span>}
                <span>{selectedSeries?.seasons} Temporadas</span>
                {selectedSeries?.rating && <span>★ {selectedSeries.rating}</span>}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-3">Episodios</h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {selectedSeries?.episodes?.map((episode, index) => (
                  <button
                    key={index}
                    data-testid={`episode-${index}`}
                    onClick={() => handleEpisodePlay(episode)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded bg-cyan-500/20 flex items-center justify-center">
                      <Play size={18} className="text-cyan-400 ml-0.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{episode.title || `Episodio ${index + 1}`}</p>
                    </div>
                  </button>
                ))}
                {(!selectedSeries?.episodes || selectedSeries.episodes.length === 0) && (
                  <p className="text-white/50 text-sm text-center py-4">
                    No hay episodios disponibles
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={isPlaying} onOpenChange={closePlayer}>
        <DialogContent className="max-w-5xl p-0 bg-black border-white/10">
          <DialogHeader className="p-4 bg-card/80">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedSeries?.title} - {selectedEpisode?.title}</span>
              <button onClick={closePlayer} className="icon-btn">
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={selectedEpisode?.url}
              controls
              autoPlay
              onError={() => toast.error("Error al reproducir")}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
