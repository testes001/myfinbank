import { Link } from "@tanstack/react-router";
import { FinBankBrand } from "@/lib/brand-config";
import { Shield, Mail, MapPin, Phone } from "lucide-react";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/marketing/features" },
        { label: "How it Works", href: "/marketing/how-it-works" },
        { label: "Pricing", href: "/marketing/pricing" },
        { label: "Security", href: "/marketing/security" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/marketing/about" },
        { label: "Blog", href: "/marketing/about" },
        { label: "Careers", href: "/marketing/about" },
        { label: "Contact", href: "/marketing/about" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/marketing/security" },
        { label: "Terms of Service", href: "/marketing/security" },
        { label: "GDPR Compliance", href: "/marketing/security" },
        { label: "Cookie Policy", href: "/marketing/security" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/marketing/how-it-works" },
        { label: "Contact Us", href: "/marketing/about" },
        { label: "Status Page", href: "/marketing/security" },
        { label: "FAQs", href: "/marketing/how-it-works" },
      ],
    },
  ];

  return (
    <footer className="relative z-10 bg-slate-900/70 text-white border-t border-white/10 backdrop-blur-2xl">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">{FinBankBrand.company.name}</span>
            </div>
            <p className="text-sm text-white/70 mb-6">
              {FinBankBrand.company.tagline}
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/70 hover:text-white transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-white">Email</p>
              <p className="text-sm text-white/70">support@finbank.online</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-white">Phone</p>
              <p className="text-sm text-white/70">+34 (0) 800 123 456</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-white">Headquarters</p>
              <p className="text-sm text-white/70">Madrid, Spain</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-white/60">
            © {currentYear} {FinBankBrand.company.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/60">
            <span>License: {FinBankBrand.company.euBankingLicense}</span>
            <span>•</span>
            <span>Authority: {FinBankBrand.company.regulatoryAuthority}</span>
            <span>•</span>
            <span>Insurance: €{FinBankBrand.trustIndicators.depositInsurance}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
