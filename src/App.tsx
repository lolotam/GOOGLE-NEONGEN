import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import ImageGen from '@/pages/ImageGen';
import VideoGen from '@/pages/VideoGen';
import Pricing from '@/pages/Pricing';
import Docs from '@/pages/Docs';
import Gallery from '@/pages/Gallery';
import CreateProfile from '@/pages/CreateProfile';
import AuthPage from '@/pages/AuthPage';

/** Route guard — redirects to /auth if not signed in */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootLayout />
            </ProtectedRoute>
          }
        >
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
