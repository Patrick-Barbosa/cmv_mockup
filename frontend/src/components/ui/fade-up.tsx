import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FadeUpProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98], // smooth custom ease
        delay: delay,
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  )
}


