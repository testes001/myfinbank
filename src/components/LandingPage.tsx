import { useState, useEffect } from "react";
import { Shield, Lock, Globe, TrendingUp, Zap, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchIPGeolocation, isEligibleCountry } from "@/lib/ip-geolocation";
import { FinBankBrand } from "@/lib/brand-config";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface LocationCheckResult {
  eligible: boolean;
  country: string;
  countryCode: string;
  city: string;
}

export function LandingPage({ onSignupClick }: { onSignupClick: () => void }) {
  const [locationCheck, setLocationCheck] = useState<LocationCheckResult | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Check user's location on mount
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const geoData = await fetchIPGeolocation();
        if (geoData) {
          const eligible = isEligibleCountry(geoData.countryCode);
          setLocationCheck({
            eligible,
            country: geoData.country,
            countryCode: geoData.countryCode,
            city: geoData.city,
          });

          if (!eligible) {
            toast.error(
              `Fin-Bank is currently available only in Spain, Germany, France, Italy, and Portugal. (Detected: ${geoData.country})`,
            );
          }
        }
      } catch (error) {
        console.error("Geolocation check failed:", error);
        // Continue without blocking on geolocation failure
        setLocationCheck({ eligible: true, country: "Unknown", countryCode: "", city: "" });
      } finally {
        setIsLoadingLocation(false);
      }
    };

    checkLocation();
  }, []);

  const handleSignupClick = () => {
    if (locationCheck && !locationCheck.eligible) {
      toast.error(
        `Fin-Bank is not available in ${locationCheck.country}. We currently serve Spain, Germany, France, Italy, and Portugal.`,
      );
      return;
    }
    onSignupClick();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {FinBankBrand.company.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#trust"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Security
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Digital Banking with Branches Across Europe
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            {FinBankBrand.company.tagline} — Fully compliant with EU regulations, GDPR, and
            deposit insurance protection.
          </p>

          {/* Eligibility Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✓ Eligibility Check
            </p>
            {isLoadingLocation ? (
              <p className="text-slate-700 dark:text-slate-300">
                Checking your eligibility...
              </p>
            ) : locationCheck?.eligible ? (
              <p className="text-slate-700 dark:text-slate-300">
                Great! Fin-Bank is available in your region ({locationCheck.city},{" "}
                {locationCheck.country}).
              </p>
            ) : (
              <p className="text-red-700 dark:text-red-300">
                Fin-Bank is exclusively available to residents of Spain, Germany, France, Italy,
                and Portugal. Detected location: {locationCheck?.country}
              </p>
            )}
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button
              onClick={handleSignupClick}
              disabled={locationCheck?.eligible === false}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg"
            >
              Open Your Account in Minutes
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Modern Banking for Modern Europe
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* SEPA Transfers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <Globe className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">SEPA Transfers</h3>
              <p className="text-slate-300">
                Send money instantly within Fin-Bank or to any EU bank in 1-2 business days. No
                hidden fees.
              </p>
            </motion.div>

            {/* Multi-Currency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <TrendingUp className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Multi-Currency Accounts</h3>
              <p className="text-slate-300">
                Hold EUR as your primary currency. Convert to USD for deposits and international
                transfers with fair rates.
              </p>
            </motion.div>

            {/* Virtual Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <Zap className="w-10 h-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Instant Virtual Cards</h3>
              <p className="text-slate-300">
                Get a virtual card instantly upon account opening. Order a physical card in 5-7
                business days.
              </p>
            </motion.div>

            {/* Mobile Deposit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Mobile Check Deposit</h3>
              <p className="text-slate-300">
                Deposit checks (USD/EUR) right from your phone. Processing typically takes 1-3
                business days.
              </p>
            </motion.div>

            {/* Joint Accounts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <Users className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Joint Accounts</h3>
              <p className="text-slate-300">
                Manage shared finances with partners, family, or businesses. Full transparency
                and control.
              </p>
            </motion.div>

            {/* Branch Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-slate-800 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-700"
            >
              <Globe className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Physical Branches</h3>
              <p className="text-slate-300">
                Visit our branches in Spain, Germany, France, Italy, and Portugal for in-person
                support.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white text-center mb-16">
            Bank-Grade Security & Compliance
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                {[
                  {
                    icon: <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
                    title: "EU Banking License",
                    description: `Full compliance with European banking regulations. License: ${FinBankBrand.company.euBankingLicense}`,
                  },
                  {
                    icon: <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />,
                    title: "GDPR Compliant",
                    description:
                      "Your personal data is protected under GDPR. Complete transparency and control over your information.",
                  },
                  {
                    icon: <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
                    title: "Deposit Insurance",
                    description:
                      "€100,000 per account protected under the EU Deposit Guarantee Scheme.",
                  },
                  {
                    icon: <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
                    title: "Advanced Encryption",
                    description:
                      "Military-grade encryption protects all your transactions and sensitive data.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 p-8 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Security Features
              </h3>
              <ul className="space-y-4">
                {[
                  "Two-factor authentication (SMS/Authenticator)",
                  "Real-time fraud detection and monitoring",
                  "Device fingerprinting and location tracking",
                  "Automatic session timeout for inactivity",
                  "End-to-end encryption for all communications",
                  "Regular security audits and penetration testing",
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Regulatory Info */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto text-center text-slate-300">
          <p className="mb-3">
            <strong>Regulatory Authority:</strong> {FinBankBrand.company.regulatoryAuthority}
          </p>
          <p>
            <strong>Service Areas:</strong> Spain • Germany • France • Italy • Portugal
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience Modern Banking?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of Europeans who trust Fin-Bank for secure, transparent banking.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button
              onClick={handleSignupClick}
              disabled={locationCheck?.eligible === false}
              className="bg-white hover:bg-slate-100 text-blue-600 px-10 py-4 rounded-lg font-bold text-lg shadow-xl"
            >
              Get Started Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Fin-Bank</h4>
              <p className="text-sm">{FinBankBrand.company.tagline}</p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Product</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-white transition">
                    Security
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/gdpr" className="hover:text-white transition">
                    GDPR Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Support</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/contact" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/help" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2024 Fin-Bank. All rights reserved.</p>
            <p className="mt-2">
              EU Banking License: {FinBankBrand.company.euBankingLicense} | Regulatory Authority:{" "}
              {FinBankBrand.company.regulatoryAuthority}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
