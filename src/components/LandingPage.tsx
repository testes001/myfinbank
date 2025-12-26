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
              `Fin-Bank is currently available only in Spain, Germany, France, Italy, Portugal, and Korea. (Detected: ${geoData.country})`,
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
        `Fin-Bank is not available in ${locationCheck.country}. We currently serve Spain, Germany, France, Italy, Portugal, and Korea.`,
      );
      return;
    }
    onSignupClick();
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.16),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.16),transparent_25%)]" />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/10 text-xs font-semibold mb-4">
            <Shield className="w-4 h-4 text-emerald-300" />
            {FinBankBrand.company.tagline}
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Digital Banking with Branches Across Europe
          </h1>

          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
            {FinBankBrand.company.tagline} — Fully compliant with EU regulations, GDPR, and
            deposit insurance protection.
          </p>

          {/* Eligibility Notice */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-6 mb-8 max-w-2xl mx-auto backdrop-blur-xl shadow-lg shadow-blue-900/20">
            <p className="text-sm font-semibold text-emerald-200 mb-2">
              ✓ Eligibility Check
            </p>
            {isLoadingLocation ? (
              <p className="text-white/70">
                Checking your eligibility...
              </p>
            ) : locationCheck?.eligible ? (
              <p className="text-white/80">
                Great! Fin-Bank is available in your region ({locationCheck.city},{" "}
                {locationCheck.country}).
              </p>
            ) : (
              <p className="text-red-200">
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
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/30 border border-white/15"
            >
              Open Your Account in Minutes
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
            >
              <Globe className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">SEPA Transfers</h3>
              <p className="text-white/70">
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
            >
              <TrendingUp className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Multi-Currency Accounts</h3>
              <p className="text-white/70">
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
            >
              <Zap className="w-10 h-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Instant Virtual Cards</h3>
              <p className="text-white/70">
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
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
      <section id="trust" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
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
                    icon: <Lock className="w-6 h-6 text-blue-300" />,
                    title: "EU Banking License",
                    description: `Full compliance with European banking regulations. License: ${FinBankBrand.company.euBankingLicense}`,
                  },
                  {
                    icon: <Shield className="w-6 h-6 text-emerald-300" />,
                    title: "GDPR Compliant",
                    description:
                      "Your personal data is protected under GDPR. Complete transparency and control over your information.",
                  },
                  {
                    icon: <TrendingUp className="w-6 h-6 text-purple-300" />,
                    title: "Deposit Insurance",
                    description:
                      "€100,000 per account protected under the EU Deposit Guarantee Scheme.",
                  },
                  {
                    icon: <Zap className="w-6 h-6 text-amber-300" />,
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
                      <h3 className="font-semibold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-white/70">{item.description}</p>
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
              className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
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
                    className="flex items-center gap-3 text-white/70"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Regulatory Info */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-white/70">
          <p className="mb-3">
            <strong>Regulatory Authority:</strong> {FinBankBrand.company.regulatoryAuthority}
          </p>
          <p>
            <strong>Service Areas:</strong> Spain • Germany • France • Italy • Portugal
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-white/10 border border-white/10 rounded-2xl p-10 backdrop-blur-xl shadow-2xl shadow-blue-900/30">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience Modern Banking?
          </h2>
          <p className="text-xl text-white/70 mb-8">
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
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/30 border border-white/15"
            >
              Get Started Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
