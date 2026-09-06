import { motion } from "framer-motion";

/**
 * React Bits BlurText.
 * Words resolve out of a blur, one after another.
 */
export default function BlurText({
  text = "",
  className = "",
  delay = 0.06,
  startDelay = 0,
  as: Tag = "span",
}) {
  const words = text.split(" ");

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: delay, delayChildren: startDelay } } }}
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block whitespace-pre"
            variants={{
              hidden: { opacity: 0, filter: "blur(10px)", y: "0.35em" },
              shown: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
