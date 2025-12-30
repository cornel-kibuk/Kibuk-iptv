import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Play,
  Film,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const placeholderImages = [
  "https://images.unsplash.com/photo-1739891251370-05b62a54697b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  "https://images.unsplash.com/photo-1742822050771-588f61785322?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  "https://images.unsplash.com/photo-1659835347242-97835d671db7?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
];

export default function VOD() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/vod`),
        axios.get(`${API}/vod/categories`),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlay = (item) => {
    setSelectedItem(item);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setSelectedItem(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
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
            <h1 className="text-xl font-bold">Video On Demand</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <Input
                data-testid="vod-search"
                type="text"
                placeholder="Buscar película..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white/5 border-white/10">
                  <span>{selectedCategory === "all" ? "Categoría" : selectedCategory}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-white/10">
                <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                  Todas
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Film size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin contenido VOD</h2>
            <p className="text-white/50 mb-4">
              Agrega una playlist M3U con contenido VOD
            </p>
            <Button onClick={() => navigate("/playlists")}>
              Agregar Playlist
            </Button>
          </div>
        ) : (
          <div className="content-grid">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                data-testid={`vod-${item.id}`}
                className="media-card group cursor-pointer"
                onClick={() => handlePlay(item)}
              >
                <img
                  src={item.poster || getPlaceholderImage(index)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getPlaceholderImage(index); }}
                />
                <div className="media-card-overlay">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  {item.year && (
                    <p className="text-xs text-white/50">{item.year}</p>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Play size={28} fill="white" className="ml-1" />
                  </div>
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
              <span>{selectedItem?.title}</span>
              <button onClick={closePlayer} className="icon-btn">
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={selectedItem?.url}
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
