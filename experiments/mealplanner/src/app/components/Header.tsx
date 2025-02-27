"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { User } from "@/worker";

export function Header(user: User) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo / Branding */}
        <a href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span>MealPlanner</span>
        </a>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="lg:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation and User Auth - Desktop */}
        <div className="hidden lg:flex items-center gap-8">
          <nav className="flex gap-6 items-center">
            <a href="/plan" className="text-gray-300 hover:text-white transition-colors">
              Meal Plan
            </a>
            <a href="/setup" className="text-gray-300 hover:text-white transition-colors">
              Setup
            </a>
          </nav>

          {/* User Authentication */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-300">
                  Hi, <span className="font-medium text-white">{user.user.username || "User"}</span>
                </p>
                <Button 
                  onClick={() => window.location.href = "/user/logout"} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-800 hover:text-white flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <a href="/user/login">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-black">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-4">
              <a 
                href="/plan" 
                className="py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Meal Plan
              </a>
              <a 
                href="/setup" 
                className="py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Setup
              </a>
              {user && (
                <a 
                  href="/user/profile" 
                  className="py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </a>
              )}
            </nav>

            <div className="pt-2 border-t border-gray-800">
              {user ? (
                <div className="flex flex-col gap-3 py-2">
                  <p className="text-sm text-gray-300">
                    Signed in as <span className="font-medium text-white">{user.user.username || "User"}</span>
                  </p>
                  <Button 
                    onClick={() => {
                      window.location.href = "/user/logout";
                      setMenuOpen(false);
                    }} 
                    variant="ghost"
                    className="text-white hover:bg-gray-800 hover:text-white w-full justify-center flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </div>
              ) : (
                <a 
                  href="/user/login" 
                  onClick={() => setMenuOpen(false)}
                  className="block w-full"
                >
                  <Button 
                    variant="default"
                    className="bg-white text-black hover:bg-gray-200 w-full justify-center"
                  >
                    Login
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
