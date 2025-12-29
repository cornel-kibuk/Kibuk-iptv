import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EPG() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [channelsRes, epgRes] = await Promise.all([
        axios.get(`${API}/channels`, { params: { radio: false } }),
        axios.get(`${API}/epg`),
      ]);
      setChannels(channelsRes.data.slice(0, 20)); // Limit for EPG display
      setPrograms(epgRes.data.programs || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const formatHour = (hour) => {
    const h = hour % 24;
    return `${h.toString().padStart(2, "0")}:00`;
  };

  const getCurrentHourPosition = () => {
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100;
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                data-testid="back-btn"
                onClick={() => navigate("/")}
                className="icon-btn"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Guía de Programación (EPG)</h1>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
                className="bg-white/5 border-white/10"
              >
                <ChevronLeft size={18} />
              </Button>
              <span className="px-4 py-2 bg-white/5 rounded-lg text-sm font-medium min-w-[200px] text-center capitalize">
                {formatDate(selectedDate)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
                className="bg-white/5 border-white/10"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* EPG Grid */}
      <main className="max-w-7xl mx-auto p-4">
        {channels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin canales para mostrar</h2>
            <p className="text-white/50 mb-4">
              Agrega una playlist M3U para ver la guía de programación
            </p>
            <Button onClick={() => navigate("/playlists")}>
              Agregar Playlist
            </Button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                {/* Time Header */}
                <div className="flex border-b border-white/10 sticky top-0 bg-card z-10">
                  <div className="w-48 flex-shrink-0 p-3 border-r border-white/10">
                    <span className="text-sm font-medium text-white/50">Canal</span>
                  </div>
                  <div className="flex-1 flex relative">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="flex-shrink-0 w-24 p-3 border-r border-white/5 text-center"
                      >
                        <span className="text-xs text-white/50">{formatHour(hour)}</span>
                      </div>
                    ))}
                    {/* Current Time Indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20"
                      style={{ left: `${getCurrentHourPosition()}%` }}
                    >
                      <div className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                        <Clock size={10} className="text-black" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Channel Rows */}
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    data-testid={`epg-channel-${channel.id}`}
                    className="flex border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* Channel Info */}
                    <div className="w-48 flex-shrink-0 p-3 border-r border-white/10 flex items-center gap-3">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold">{channel.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium truncate">{channel.name}</span>
                    </div>

                    {/* Programs */}
                    <div className="flex-1 flex items-center gap-1 p-1">
                      {programs.map((program, index) => (
                        <div
                          key={`${channel.id}-${program.id}-${index}`}
                          className="epg-program h-14 flex-1"
                          title={program.title}
                        >
                          <p className="font-medium text-xs truncate">{program.title}</p>
                          <p className="text-[10px] text-white/50 truncate">
                            {program.description}
                          </p>
                        </div>
                      ))}
                      {programs.length === 0 && (
                        <div className="flex-1 p-2 text-xs text-white/30 text-center">
                          Sin información de programación
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-400" />
            <span>Hora actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-400/30 border border-cyan-400/50" />
            <span>Programa actual</span>
          </div>
        </div>
      </main>
    </div>
  );
}
