import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Shield,
  TrendingUp,
  Zap,
  Globe,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchIPGeolocation, isEligibleCountry } from "@/lib/ip-geolocation";
import { useNavigate } from "@tanstack/react-router";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function MarketingHomePage() {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const demoUrl = import.meta.env.VITE_DEMO_URL || "https://example.com/demo";

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const geo = await fetchIPGeolocation();
        if (geo) {
          setEligible(isEligibleCountry(geo.countryCode));
        }
      } catch {
        setEligible(true);
      }
    };
    checkEligibility();
  }, []);

  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Instant Transfers",
      description: "Send money across Europe instantly with SEPA transfers",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Bank-Grade Security",
      description: "Military-grade encryption protects your data 24/7",
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Multi-Currency",
      description: "Hold and exchange EUR and USD with real rates",
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Cards",
      description: "Get a virtual card instantly, physical in 5-7 days",
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Insured Deposits",
      description: "€100,000 protection under EU guarantee scheme",
      color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Joint Accounts",
      description: "Manage shared finances with partners and family",
      color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    },
  ];

  const testimonials = [
    {
      name: "Sarah",
      role: "Freelancer",
      country: "Germany",
      text: "Finally a bank that gets digital. The interface is intuitive and transfers are instant!",
      avatar: "👩‍💼",
    },
    {
      name: "Marco",
      role: "Small Business Owner",
      country: "Italy",
      text: "The best banking solution for my business. No hidden fees and transparent pricing.",
      avatar: "👨‍💼",
    },
    {
      name: "Elena",
      role: "Expat",
      country: "Spain",
      text: "As an expat, this bank makes life so much easier. Multi-currency support is amazing!",
      avatar: "👩",
    },
  ];

  const handleGetStarted = () => {
    navigate({ to: "/account-type" });
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  EU Licensed | PSD2 Compliant | 100k EUR Insured
                </p>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight font-['Space Grotesk',_Inter,_sans-serif]">
                  Banking that moves as fast as you do
                </h1>
                <p className="text-xl text-white/70">
                  Licensed digital banking headquartered in Spain with branches across Europe, now welcoming customers from Korea, with SEPA, ES IBANs, 3D Secure cards, and GDPR-grade privacy.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white flex items-center gap-2 border border-white/10 shadow-lg shadow-blue-500/30"
                  disabled={eligible === false}
                  aria-disabled={eligible === false}
                  onClick={handleGetStarted}
                  title="Choose account type and sign up"
                >
                  Open Account <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.open(demoUrl, "_blank")}
                >
                  Watch 60s Demo
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  4.9/5 • 12k+ reviews
                </div>
                <span className="hidden sm:inline text-white/40">•</span>
                <div className="flex items-center gap-3">
                  <span className="uppercase tracking-wide text-xs text-white/60">Trusted by teams at</span>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span>Rappi</span>
                    <span>Cabify</span>
                    <span>N26</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full text-xs text-white/80 border border-white/10">
                <span className="font-semibold">Demo login</span>
                <span>alice@demo.com</span>
                <span className="text-slate-400">/</span>
                <span>demo123</span>
              </div>

              {/* Trust Badges */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-6">
                {[
                  { icon: "🔒", text: "PSD2 + 3D Secure" },
                  { icon: "✓", text: "GDPR Compliant" },
                  { icon: "💰", text: "€100k Deposit Guarantee" },
                  { icon: "🌐", text: "Eligible: ES, DE, FR, IT, PT, KR" },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white/80 backdrop-blur"
                  >
                    <span>{badge.icon}</span>
                    {badge.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              variants={itemVariants}
              className="relative h-[500px] hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/25 via-blue-500/10 to-purple-400/25 rounded-2xl blur-3xl"></div>
              <div className="relative h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute -left-10 top-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -right-10 bottom-8 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="relative text-center">
                  <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg">Secure Banking Interface</p>
                  <p className="text-white/60 text-sm mt-2">Real-time fraud monitoring, device fingerprinting, and encrypted card vault.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need for Modern Banking
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Powerful features designed for the way you actually bank
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-white/10 rounded-2xl p-8 shadow-lg shadow-blue-900/25 border border-white/10 backdrop-blur-xl hover:border-white/20 transition"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              { number: "50K+", label: "Happy Users" },
              { number: "€500M+", label: "Transactions" },
              { number: "5", label: "Countries" },
              { number: "24/7", label: "Support" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/20"
              >
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </p>
                <p className="text-white/70 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works - Quick Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Open an Account in 3 Steps
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Get started in minutes, not days
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { number: "1", title: "Sign Up", description: "Complete your profile in 5 minutes" },
              { number: "2", title: "Verify", description: "Identity verification via your phone" },
              { number: "3", title: "Fund", description: "Link your bank account and you're ready" },
            ].map((step) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative bg-white/10 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-lg shadow-blue-900/25"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 text-white font-bold text-lg shadow-md shadow-blue-500/30">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-white/70">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Loved by Users Across Europe
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See what our customers are saying
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                className="bg-white/10 rounded-2xl p-8 shadow-lg shadow-blue-900/25 border border-white/10 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{testimonial.avatar}</span>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/70">
                      {testimonial.role} • {testimonial.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Experience the Future of Banking?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of Europeans who have already switched to Fin-Bank
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white font-bold flex items-center gap-2 border border-white/10 shadow-lg shadow-blue-500/30"
                disabled={eligible === false}
                onClick={handleGetStarted}
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Clock className="w-5 h-5 mr-2" />
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
