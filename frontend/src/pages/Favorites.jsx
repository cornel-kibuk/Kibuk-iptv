import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Favorites() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API}/favorites`);
      setFavorites(res.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar favoritos");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (favorite) => {
    setSelectedChannel(favorite);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setSelectedChannel(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const confirmDelete = (favorite) => {
    setChannelToDelete(favorite);
  };

  const handleDelete = async () => {
    if (!channelToDelete) return;
    
    try {
      await axios.delete(`${API}/favorites/${channelToDelete.channel_id}`);
      setFavorites(favorites.filter(f => f.channel_id !== channelToDelete.channel_id));
      toast.success("Eliminado de favoritos");
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setChannelToDelete(null);
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
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            data-testid="back-btn"
            onClick={() => navigate("/")}
            className="icon-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Mis Favoritos</h1>
          <span className="badge ml-auto">{favorites.length} canales</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Star size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin favoritos</h2>
            <p className="text-white/50 mb-4">
              Agrega canales a favoritos desde Live TV
            </p>
            <Button onClick={() => navigate("/live-tv")}>
              Ir a Live TV
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                data-testid={`favorite-${favorite.channel_id}`}
                className="glass-card p-4 flex items-center gap-4"
              >
                {favorite.channel_logo ? (
                  <img
                    src={favorite.channel_logo}
                    alt={favorite.channel_name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <Star size={20} className="text-yellow-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{favorite.channel_name}</h3>
                  <p className="text-sm text-white/50">{favorite.channel_group || "General"}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handlePlay(favorite)}
                    className="gap-2"
                  >
                    <Play size={16} />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => confirmDelete(favorite)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      <Dialog open={isPlaying} onOpenChange={closePlayer}>
        <DialogContent className="max-w-5xl p-0 bg-black border-white/10">
          <DialogHeader className="p-4 bg-card/80">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedChannel?.channel_name}</span>
              <button onClick={closePlayer} className="icon-btn">
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={selectedChannel?.channel_url}
              controls
              autoPlay
              onError={() => toast.error("Error al reproducir")}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!channelToDelete} onOpenChange={() => setChannelToDelete(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar de favoritos?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{channelToDelete?.channel_name}" de tus favoritos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
