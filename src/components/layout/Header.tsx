import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { 
  Home, 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  LayoutDashboard, 
  CreditCard,
  BookOpen,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/generate/image', icon: ImageIcon, label: 'Image' },
  { to: '/generate/video', icon: Video, label: 'Video' },
  { to: '/gallery', icon: LayoutDashboard, label: 'Gallery' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing' },
  { to: '/docs', icon: BookOpen, label: 'API' },
];

export const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-white/5 bg-background-secondary/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-neon flex items-center justify-center">
            <span className="text-background-primary font-bold text-xl">N</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block">NeonGen</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-primary-neon/10 text-primary-neon" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary-neon" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side (User/Mobile Toggle) */}
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-neon to-primary-lime" />
            <span className="text-sm font-medium">Account</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-64 bg-background-secondary border-l border-white/10 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-bold text-xl">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="text-gray-400" />
              </button>
            </div>

            <nav className="space-y-2 flex-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-primary-neon/10 text-primary-neon border border-primary-neon/20" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary-neon" : "text-gray-400")} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-white/10">
              <Link 
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-neon to-primary-lime" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">User Account</p>
                  <p className="text-xs text-gray-500 truncate">Free Plan</p>
                </div>
                <Settings className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
