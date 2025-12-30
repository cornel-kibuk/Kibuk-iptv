import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Shield,
  Monitor,
  Globe,
  Database,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    player_quality: "auto",
    buffer_size: 30,
    epg_url: "",
    parental_control: false,
    parental_pin: "",
    ui_scale: "normal",
    language: "es",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success("Configuración guardada");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-btn"
              onClick={() => navigate("/")}
              className="icon-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Configuración</h1>
          </div>
          <Button
            data-testid="save-settings-btn"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        {/* Player Settings */}
        <div className="settings-group">
          <div className="flex items-center gap-3 mb-4">
            <Monitor size={20} className="text-cyan-400" />
            <h2 className="font-semibold">Reproductor</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="settings-label">Calidad de video</label>
              <Select
                value={settings.player_quality}
                onValueChange={(value) => updateSetting("player_quality", value)}
              >
                <SelectTrigger data-testid="quality-select" className="bg-black/30 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="auto">Automática</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="360p">360p</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="settings-label">Buffer (segundos)</label>
              <Input
                data-testid="buffer-input"
                type="number"
                value={settings.buffer_size}
                onChange={(e) => updateSetting("buffer_size", parseInt(e.target.value) || 30)}
                className="settings-input"
                min={5}
                max={120}
              />
            </div>
          </div>
        </div>

        {/* EPG Settings */}
        <div className="settings-group">
          <div className="flex items-center gap-3 mb-4">
            <Database size={20} className="text-cyan-400" />
            <h2 className="font-semibold">EPG (Guía de Programación)</h2>
          </div>

          <div>
            <label className="settings-label">URL del EPG (XMLTV)</label>
            <Input
              data-testid="epg-url-input"
              type="url"
              value={settings.epg_url || ""}
              onChange={(e) => updateSetting("epg_url", e.target.value)}
              placeholder="https://ejemplo.com/epg.xml"
              className="settings-input"
            />
            <p className="text-xs text-white/40 mt-1">
              Ingresa la URL de tu archivo XMLTV para mostrar la programación
            </p>
          </div>
        </div>

        {/* Parental Control */}
        <div className="settings-group">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-cyan-400" />
            <h2 className="font-semibold">Control Parental</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activar control parental</p>
                <p className="text-sm text-white/50">Bloquear contenido para adultos</p>
              </div>
              <Switch
                data-testid="parental-switch"
                checked={settings.parental_control}
                onCheckedChange={(checked) => updateSetting("parental_control", checked)}
              />
            </div>

            {settings.parental_control && (
              <div>
                <label className="settings-label">PIN de acceso</label>
                <Input
                  data-testid="parental-pin-input"
                  type="password"
                  value={settings.parental_pin || ""}
                  onChange={(e) => updateSetting("parental_pin", e.target.value)}
                  placeholder="Ingresa un PIN de 4 dígitos"
                  maxLength={4}
                  className="settings-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* UI Settings */}
        <div className="settings-group">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={20} className="text-cyan-400" />
            <h2 className="font-semibold">Interfaz</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="settings-label">Escala de interfaz</label>
              <Select
                value={settings.ui_scale}
                onValueChange={(value) => updateSetting("ui_scale", value)}
              >
                <SelectTrigger data-testid="scale-select" className="bg-black/30 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="small">Pequeña</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="settings-label">Idioma</label>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSetting("language", value)}
              >
                <SelectTrigger data-testid="language-select" className="bg-black/30 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="settings-group">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={20} className="text-cyan-400" />
            <h2 className="font-semibold">Información</h2>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Versión</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Última actualización</span>
              <span>Diciembre 2025</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
