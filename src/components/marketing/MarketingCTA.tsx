import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface MarketingCTAProps {
  title?: string;
  description?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function MarketingCTA({
  title = "Ready to Get Started?",
  description = "Join thousands of Europeans who have already switched to Fin-Bank",
}: MarketingCTAProps) {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          <Button
            size="lg"
            className="bg-white hover:bg-white/90 text-blue-600 font-bold flex items-center gap-2 shadow-lg"
            onClick={() => navigate({ to: "/account-type" })}
          >
            Open Account <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
