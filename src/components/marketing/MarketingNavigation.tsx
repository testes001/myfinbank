import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FinBankBrand } from "@/lib/brand-config";
import { Menu, X, Shield, ArrowRight } from "lucide-react";

export function MarketingNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Features", href: "/marketing/features" },
    { label: "How it Works", href: "/marketing/how-it-works" },
    { label: "Pricing", href: "/marketing/pricing" },
    { label: "Security", href: "/marketing/security" },
    { label: "About", href: "/marketing/about" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-slate-900/70 backdrop-blur-2xl border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/marketing" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white group-hover:text-emerald-200 transition">
              {FinBankBrand.company.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white"
              onClick={() => navigate({ to: "/login" })}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white flex items-center gap-2 border border-white/10 shadow-lg shadow-blue-500/30"
              onClick={() => navigate({ to: "/login" })}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate({ to: "/login" });
                }}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white border border-white/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate({ to: "/login" });
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
