import { motion } from "framer-motion";

/**
 * React Bits AnimatedContent.
 * Reveals its children the first time they scroll into view.
 */
export default function AnimatedContent({
  children,
  distance = 28,
  delay = 0,
  duration = 0.7,
  className = "",
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
