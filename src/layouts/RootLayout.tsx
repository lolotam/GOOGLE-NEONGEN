import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';

export const RootLayout = () => {
  return (
    <div className="h-screen bg-background-primary text-white flex flex-col overflow-hidden">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 min-w-0 relative z-10 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
