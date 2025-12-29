import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search as SearchIcon,
  Tv,
  Film,
  Clapperboard,
  Radio,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    channels: [],
    vod: [],
    series: [],
  });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const debounce = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults({ channels: [], vod: [], series: [] });
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [channelsRes, vodRes, seriesRes] = await Promise.all([
        axios.get(`${API}/channels`, { params: { search: query } }),
        axios.get(`${API}/vod`, { params: { search: query } }),
        axios.get(`${API}/series`, { params: { search: query } }),
      ]);
      setResults({
        channels: channelsRes.data,
        vod: vodRes.data,
        series: seriesRes.data,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results.channels.length + results.vod.length + results.series.length;

  const ResultItem = ({ item, type, icon: Icon }) => (
    <button
      data-testid={`result-${type}-${item.id}`}
      onClick={() => {
        if (type === "channel" || type === "radio") {
          navigate("/live-tv");
        } else if (type === "vod") {
          navigate("/vod");
        } else {
          navigate("/series");
        }
      }}
      className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-cyan-500/50 transition-all"
    >
      {item.logo || item.poster ? (
        <img
          src={item.logo || item.poster}
          alt={item.name || item.title}
          className="w-12 h-12 rounded-lg object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon size={20} className="text-cyan-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{item.name || item.title}</h3>
        <p className="text-sm text-white/50">{item.group || item.category || type}</p>
      </div>
      <Play size={18} className="text-cyan-400" />
    </button>
  );

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-20 glass p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Buscar</h1>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <Input
              data-testid="global-search"
              type="text"
              placeholder="Buscar canales, películas, series..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-white/5 border-white/10"
              autoFocus
            />
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : query.length < 2 ? (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <SearchIcon size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Buscar contenido</h2>
            <p className="text-white/50">
              Escribe al menos 2 caracteres para buscar
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <SearchIcon size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin resultados</h2>
            <p className="text-white/50">
              No se encontró contenido para "{query}"
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/50 mb-4">
              {totalResults} resultado{totalResults !== 1 ? "s" : ""} para "{query}"
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start bg-white/5 mb-4">
                <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20">
                  Todos ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="channels" className="data-[state=active]:bg-cyan-500/20">
                  Canales ({results.channels.length})
                </TabsTrigger>
                <TabsTrigger value="vod" className="data-[state=active]:bg-cyan-500/20">
                  VOD ({results.vod.length})
                </TabsTrigger>
                <TabsTrigger value="series" className="data-[state=active]:bg-cyan-500/20">
                  Series ({results.series.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {results.channels.slice(0, 5).map((item) => (
                  <ResultItem key={item.id} item={item} type={item.is_radio ? "radio" : "channel"} icon={item.is_radio ? Radio : Tv} />
                ))}
                {results.vod.slice(0, 5).map((item) => (
                  <ResultItem key={item.id} item={item} type="vod" icon={Film} />
                ))}
                {results.series.slice(0, 5).map((item) => (
                  <ResultItem key={item.id} item={item} type="series" icon={Clapperboard} />
                ))}
              </TabsContent>

              <TabsContent value="channels" className="space-y-3">
                {results.channels.map((item) => (
                  <ResultItem key={item.id} item={item} type={item.is_radio ? "radio" : "channel"} icon={item.is_radio ? Radio : Tv} />
                ))}
              </TabsContent>

              <TabsContent value="vod" className="space-y-3">
                {results.vod.map((item) => (
                  <ResultItem key={item.id} item={item} type="vod" icon={Film} />
                ))}
              </TabsContent>

              <TabsContent value="series" className="space-y-3">
                {results.series.map((item) => (
                  <ResultItem key={item.id} item={item} type="series" icon={Clapperboard} />
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
