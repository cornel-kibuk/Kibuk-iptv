# IPTV Stream - Product Requirements Document

## Original Problem Statement
Aplicación IPTV funcional similar a iptvextremelite.com con todas las funcionalidades: Live TV, VOD, Series, EPG, Account, Multi, Catch Up, Favorite, Radio, Settings, Search, REC, MSG, Update. Sin autenticación (uso libre). Usuarios pueden agregar sus propias listas M3U.

## User Personas
- **Cord-cutters**: Usuarios que abandonaron TV por cable y buscan alternativas IPTV
- **IPTV Enthusiasts**: Usuarios con proveedores de IPTV que necesitan una interfaz moderna
- **General Streamers**: Personas que quieren acceder a contenido multimedia desde una única aplicación

## Core Requirements (Static)
1. Gestión de Playlists M3U (agregar, eliminar, parsear)
2. Reproducción de canales en vivo
3. Catálogo VOD (películas)
4. Catálogo de Series
5. Guía de Programación (EPG)
6. Favoritos
7. Radio
8. Configuraciones (calidad, buffer, control parental)
9. Búsqueda global
10. Tema oscuro estilo TV streaming

## What's Been Implemented ✅ (Dec 29, 2025)

### Backend (FastAPI)
- ✅ Parser de M3U con categorización automática (canales, VOD, series, radio)
- ✅ CRUD completo para playlists
- ✅ Endpoints para canales con filtros (grupo, búsqueda, radio)
- ✅ Endpoints VOD y Series con categorías
- ✅ Sistema de favoritos (agregar/eliminar)
- ✅ Configuraciones persistentes en MongoDB
- ✅ EPG mock con datos de ejemplo
- ✅ Grabaciones y mensajes (estructura base)

### Frontend (React)
- ✅ Dashboard principal estilo TV launcher con efectos de luz
- ✅ 4 botones ovalados principales (Live TV, EPG, VOD, Series)
- ✅ 6 botones cuadrados inferiores (Account, Multi, Catch Up, Favorite, Radio, Settings)
- ✅ Iconos superiores (Search, Parental, REC, MSG, Update)
- ✅ Página Live TV con reproductor de video y lista de canales
- ✅ Página VOD con grid de contenido
- ✅ Página Series con detalle y episodios
- ✅ Página EPG con guía de programación
- ✅ Página Favoritos
- ✅ Página Radio con controles de audio
- ✅ Página Settings completa
- ✅ Página Search con búsqueda global
- ✅ Página Playlists para gestión de M3U
- ✅ Diseño glassmorphism con tema oscuro azulado

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Estructura básica de la app
- [x] Parser M3U funcional
- [x] Reproductor de video
- [x] Gestión de playlists

### P1 (High Priority) - Pending
- [ ] Soporte para Xtream Codes API
- [ ] EPG real desde URL XMLTV
- [ ] Multi-screen view
- [ ] Catch Up (replay de contenido)

### P2 (Medium Priority) - Pending  
- [ ] Grabación real de canales
- [ ] Sistema de mensajes funcional
- [ ] Historial de visualización
- [ ] Búsqueda avanzada con filtros

### P3 (Nice to Have)
- [ ] PWA para instalación
- [ ] Control remoto keyboard
- [ ] Modo PiP (Picture in Picture)
- [ ] Integración con EPG externos

## Technical Architecture
```
Frontend (React + Tailwind + Shadcn/UI)
    ↓
API Gateway (/api prefix)
    ↓
Backend (FastAPI)
    ↓
MongoDB (playlists, channels, favorites, settings)
```

## Next Tasks
1. Implementar soporte para Xtream Codes API
2. Parsear EPG real desde URLs XMLTV
3. Implementar Multi-screen view
4. Agregar Catch Up functionality
