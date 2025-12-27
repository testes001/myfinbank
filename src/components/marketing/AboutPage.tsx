import { motion } from "framer-motion";
import { FinBankBrand } from "@/lib/brand-config";
import { Users, Target, Heart, Globe } from "lucide-react";
import { MarketingCTA } from "@/components/marketing/MarketingCTA";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function AboutPage() {
  const teamValues = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Customer-First Mentality",
      description: "Every decision we make is driven by what's best for our customers",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Transparency",
      description: "No hidden fees, no surprises. We're completely open about our practices",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Innovation",
      description: "We constantly push banking technology forward for better user experience",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Inclusion",
      description: "Banking should be accessible to everyone, regardless of background",
    },
  ];

  const milestones = [
    { year: "2023", event: "Fin-Bank founded in Madrid, Spain" },
    { year: "2023 Q2", event: "EU Banking License obtained" },
    { year: "2023 Q3", event: "Launched in Spain, Germany, France" },
    { year: "2024 Q1", event: "Expanded to Italy and Portugal" },
    { year: "2024", event: "50,000+ active users across Europe" },
    { year: "2024", event: "€500M+ transactions processed" },
  ];

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white">
              About Fin-Bank
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Reimagining European banking for the digital age
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {FinBankBrand.company.tagline}
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We believe banking should be simple, transparent, and accessible to everyone. 
                Our mission is to provide a modern banking experience that puts customers first, 
                with zero hidden fees and complete transparency.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Whether you're a freelancer, small business owner, expat, or someone who just 
                wants better banking—Fin-Bank is built for you.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
            >
              <div className="text-center">
                <Globe className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Banking for Modern Europe
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              These principles guide everything we do
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {teamValues.map((value) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              How we got here and where we're going
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {milestones.map((milestone, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {milestone.year}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              { number: "50K+", label: "Active Users" },
              { number: "5", label: "Countries Served" },
              { number: "€500M+", label: "Transactions" },
              { number: "24/7", label: "Support Available" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Built by Passionate People
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              A diverse team of fintech veterans, software engineers, and banking experts
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                role: "CEO & Co-Founder",
                description: "Former product lead at European fintech. 10 years in banking.",
                emoji: "👨‍💼",
              },
              {
                role: "CTO & Co-Founder",
                description: "Ex-Google engineer. Built payment systems for 100M+ users.",
                emoji: "👨‍💻",
              },
              {
                role: "Head of Compliance",
                description: "Banking lawyer with 15 years in regulatory affairs.",
                emoji: "👩‍⚖️",
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700"
              >
                <p className="text-5xl mb-4">{member.emoji}</p>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {member.role}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{member.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Have questions or want to learn more? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a
                href="mailto:hello@finbank.online"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-semibold"
              >
                📧 hello@finbank.online
              </a>
              <a
                href="tel:+34800123456"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-semibold"
              >
                📞 +34 (0) 800 123 456
              </a>
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-semibold"
              >
                📍 Madrid, Spain
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingCTA
        title="Learn More About Our Story"
        description="Ready to be part of the future of European banking? Open your account today."
      />
    </div>
  );
}
