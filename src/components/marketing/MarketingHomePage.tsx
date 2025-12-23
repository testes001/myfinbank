import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FinBankBrand } from "@/lib/brand-config";
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
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Modern Banking for Europe & Korea
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300">
                  Licensed digital banking headquartered in Spain with branches across Europe—now welcoming customers from Korea—with SEPA, ES IBANs, 3D Secure cards, and GDPR-grade privacy.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  disabled={eligible === false}
                  aria-disabled={eligible === false}
                >
                  Get Started Now <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Trust Badges */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-6">
                {[
                  { icon: "🔒", text: "EU Banking License" },
                  { icon: "✓", text: "GDPR Compliant" },
                  { icon: "💰", text: "€100k Insured" },
                  { icon: "🌐", text: "Eligible: ES, DE, FR, IT, PT, KR" },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300"
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-3xl"></div>
              <div className="relative h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-white font-semibold">Secure Banking Interface</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need for Modern Banking
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
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
                className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
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
                className="text-center p-6"
              >
                <p className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works - Quick Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Open an Account in 3 Steps
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
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
                className="relative"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by Users Across Europe
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
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
                className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{testimonial.avatar}</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonial.role} • {testimonial.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950">
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
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of Europeans who have already switched to Fin-Bank
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white hover:bg-slate-100 text-blue-600 font-bold flex items-center gap-2"
                disabled={eligible === false}
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
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
