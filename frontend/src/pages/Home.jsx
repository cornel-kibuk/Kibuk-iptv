import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Search,
  Shield,
  Circle,
  Mail,
  RefreshCw,
  Tv,
  Calendar,
  Film,
  Clapperboard,
  User,
  LayoutGrid,
  History,
  Star,
  Radio,
  Settings,
  Play,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_live-tv-streaming-1/artifacts/lq4ihzsa_Logo%20vibrante%20de%20KibukIPTV.png";

const TopNavIcons = ({ onSearch, messageCount }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2">
      <button
        data-testid="search-btn"
        onClick={() => navigate("/search")}
        className="icon-btn relative"
        title="Buscar"
      >
        <Search size={22} />
      </button>
      <button
        data-testid="parental-btn"
        className="icon-btn"
        title="Control Parental"
        onClick={() => navigate("/settings")}
      >
        <Shield size={22} />
      </button>
      <button
        data-testid="rec-btn"
        className="icon-btn"
        title="Grabaciones"
      >
        <Circle size={22} className="text-red-500" fill="currentColor" />
      </button>
      <button
        data-testid="msg-btn"
        className="icon-btn relative"
        title="Mensajes"
      >
        <Mail size={22} />
        {messageCount > 0 && (
          <span className="notification-badge">{messageCount}</span>
        )}
      </button>
      <button
        data-testid="update-btn"
        className="icon-btn"
        title="Actualizaciones"
      >
        <RefreshCw size={22} />
      </button>
    </div>
  );
};

const MainNavButton = ({ icon: Icon, label, onClick, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    className="oval-btn flex flex-col items-center justify-center gap-3 p-6 w-full min-h-[140px] md:min-h-[160px]"
  >
    <Icon size={40} strokeWidth={1.5} className="text-cyan-400" />
    <span className="text-sm md:text-base font-semibold tracking-wide uppercase">
      {label}
    </span>
  </button>
);

const UtilityButton = ({ icon: Icon, label, onClick, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    className="square-btn flex flex-col items-center justify-center gap-2 p-4 aspect-square"
  >
    <Icon size={28} strokeWidth={1.5} className="text-cyan-400" />
    <span className="text-xs font-medium tracking-wide">{label}</span>
  </button>
);

export default function Home() {
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);
  const [channelCount, setChannelCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [messagesRes, channelsRes] = await Promise.all([
          axios.get(`${API}/messages`),
          axios.get(`${API}/channels`),
        ]);
        setMessageCount(messagesRes.data.filter(m => !m.read).length);
        setChannelCount(channelsRes.data.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const checkForUpdates = async () => {
    try {
      const res = await axios.get(`${API}/version`);
      if (res.data.update_available) {
        toast.info("Nueva actualización disponible");
      } else {
        toast.success("Tu aplicación está actualizada");
      }
    } catch {
      toast.error("Error al verificar actualizaciones");
    }
  };

  return (
    <div className="min-h-screen relative z-10 p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 md:mb-12">
        <div className="logo-container">
          <img 
            src={LOGO_URL} 
            alt="KibukIPTV" 
            className="h-14 md:h-16 w-auto object-contain"
          />
          <div className="ml-2">
            <p className="text-xs text-white/50">{channelCount} canales disponibles</p>
          </div>
        </div>
        <TopNavIcons onSearch={() => navigate("/search")} messageCount={messageCount} />
      </header>

      {/* Main Navigation - Oval Buttons */}
      <main className="max-w-5xl mx-auto mb-12">
        <div className="nav-grid">
          <MainNavButton
            icon={Tv}
            label="Live TV"
            onClick={() => navigate("/live-tv")}
            testId="live-tv-btn"
          />
          <MainNavButton
            icon={Calendar}
            label="EPG"
            onClick={() => navigate("/epg")}
            testId="epg-btn"
          />
          <MainNavButton
            icon={Film}
            label="VOD"
            onClick={() => navigate("/vod")}
            testId="vod-btn"
          />
          <MainNavButton
            icon={Clapperboard}
            label="Series"
            onClick={() => navigate("/series")}
            testId="series-btn"
          />
        </div>
      </main>

      {/* Footer Navigation - Square Buttons */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 glass">
        <div className="max-w-4xl mx-auto">
          <div className="footer-nav">
            <UtilityButton
              icon={User}
              label="Account"
              onClick={() => navigate("/playlists")}
              testId="account-btn"
            />
            <UtilityButton
              icon={LayoutGrid}
              label="Multi"
              onClick={() => toast.info("Modo Multi-pantalla próximamente")}
              testId="multi-btn"
            />
            <UtilityButton
              icon={History}
              label="Catch Up"
              onClick={() => toast.info("Catch Up próximamente")}
              testId="catchup-btn"
            />
            <UtilityButton
              icon={Star}
              label="Favorite"
              onClick={() => navigate("/favorites")}
              testId="favorite-btn"
            />
            <UtilityButton
              icon={Radio}
              label="Radio"
              onClick={() => navigate("/radio")}
              testId="radio-btn"
            />
            <UtilityButton
              icon={Settings}
              label="Settings"
              onClick={() => navigate("/settings")}
              testId="settings-btn"
            />
          </div>
        </div>
      </footer>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
