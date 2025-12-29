import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  List,
  Link,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export default function Playlists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", url: "" });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API}/playlists`);
      setPlaylists(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlaylist = async () => {
    if (!newPlaylist.name || !newPlaylist.url) {
      toast.error("Completa todos los campos");
      return;
    }

    setAdding(true);
    try {
      const res = await axios.post(`${API}/playlists`, newPlaylist);
      setPlaylists([...playlists, res.data]);
      setShowAddModal(false);
      setNewPlaylist({ name: "", url: "" });
      toast.success("Playlist agregada correctamente");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al agregar playlist");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!playlistToDelete) return;

    try {
      await axios.delete(`${API}/playlists/${playlistToDelete.id}`);
      setPlaylists(playlists.filter(p => p.id !== playlistToDelete.id));
      toast.success("Playlist eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setPlaylistToDelete(null);
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Mis Playlists</h1>
          </div>
          <Button
            data-testid="add-playlist-btn"
            onClick={() => setShowAddModal(true)}
            className="gap-2"
          >
            <Plus size={18} />
            Agregar
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        {playlists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <List size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin playlists</h2>
            <p className="text-white/50 mb-4">
              Agrega una playlist M3U para comenzar a ver contenido
            </p>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus size={18} />
              Agregar Playlist
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                data-testid={`playlist-${playlist.id}`}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <List size={24} className="text-cyan-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{playlist.name}</h3>
                  <p className="text-sm text-white/50 truncate flex items-center gap-1">
                    <Link size={12} />
                    {playlist.url}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // Refresh playlist
                      toast.info("Actualizando playlist...");
                    }}
                    className="text-cyan-400"
                  >
                    <RefreshCw size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPlaylistToDelete(playlist)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 glass-card p-4">
          <h3 className="font-semibold mb-2">¿Qué es una playlist M3U?</h3>
          <p className="text-sm text-white/70 mb-3">
            Una playlist M3U es un archivo que contiene enlaces a canales de TV en vivo, 
            películas y series. Puedes obtener estas playlists de tu proveedor de IPTV.
          </p>
          <div className="text-xs text-white/50">
            <p className="mb-1">Formatos soportados:</p>
            <ul className="list-disc list-inside">
              <li>URLs que terminan en .m3u o .m3u8</li>
              <li>Xtream Codes API</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Add Playlist Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-white/10 z-[200]">
          <DialogHeader>
            <DialogTitle>Agregar Playlist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="settings-label">Nombre de la playlist</label>
              <Input
                data-testid="playlist-name-input"
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                placeholder="Mi IPTV"
                className="bg-black/30 border-white/10"
              />
            </div>

            <div>
              <label className="settings-label">URL de la playlist M3U</label>
              <Input
                data-testid="playlist-url-input"
                type="url"
                value={newPlaylist.url}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, url: e.target.value })}
                placeholder="https://ejemplo.com/playlist.m3u"
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button 
              data-testid="submit-playlist-btn"
              onClick={handleAddPlaylist} 
              disabled={adding}
            >
              {adding ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{playlistToDelete?.name}"? 
              Se eliminarán todos los canales asociados.
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
