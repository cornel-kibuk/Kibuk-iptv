import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Home from "./pages/Home";
import LiveTV from "./pages/LiveTV";
import VOD from "./pages/VOD";
import Series from "./pages/Series";
import EPG from "./pages/EPG";
import Favorites from "./pages/Favorites";
import Radio from "./pages/Radio";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import Playlists from "./pages/Playlists";

function App() {
  return (
    <div className="App main-bg">
      <div className="light-rays" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live-tv" element={<LiveTV />} />
          <Route path="/vod" element={<VOD />} />
          <Route path="/series" element={<Series />} />
          <Route path="/epg" element={<EPG />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<Search />} />
          <Route path="/playlists" element={<Playlists />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
