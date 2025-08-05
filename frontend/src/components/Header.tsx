import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Newspaper, Home, Search, User, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/personalized', icon: User, label: 'For You' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <Newspaper className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">
              NewsHub
            </h1>
            <p className="text-xs text-gray-500 -mt-1">Stay informed, stay ahead</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Button
              key={path}
              variant={isActive(path) ? 'default' : 'ghost'}
              size="sm"
              asChild
              className={isActive(path) 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            >
              <Link to={path}>
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>

        {/* Right side - Date and Redis tag */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
            <img src="/redis.svg" alt="Redis" className="w-4 h-4" />
            <span className="text-xs font-medium text-red-700">Powered by Redis</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(path)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
            <div className="pt-2 mt-4 border-t border-gray-100">
              <div className="px-3 py-2 text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="px-3 py-1">
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full inline-flex">
                  <img src="/redis.svg" alt="Redis" className="w-4 h-4" />
                  <span className="text-xs font-medium text-red-700">Powered by Redis</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};