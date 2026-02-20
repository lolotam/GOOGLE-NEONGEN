import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import ImageGen from '@/pages/ImageGen';
import VideoGen from '@/pages/VideoGen';
import Pricing from '@/pages/Pricing';
import Docs from '@/pages/Docs';
import Gallery from '@/pages/Gallery';
import CreateProfile from '@/pages/CreateProfile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="generate/image" element={<ImageGen />} />
          <Route path="generate/video" element={<VideoGen />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="profiles/create" element={<CreateProfile />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="docs" element={<Docs />} />
          <Route path="dashboard" element={<div className="p-10">Dashboard (Coming Soon)</div>} />
          <Route path="*" element={<div className="p-10">404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
