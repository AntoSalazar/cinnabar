import React, { ReactNode, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import useMeasure from 'react-use-measure';

const springConfig = { stiffness: 200, damping: 20, bounce: 0.2 };

interface ExpandableProps {
  children: ReactNode;
  isExpanded: boolean;
  collapsedSize: { width: number; height: number };
  expandedSize: { width: number; height: number };
  className?: string;
  onClick?: () => void;
  borderRadius?: { collapsed: string; expanded: string };
}

export const Expandable = React.forwardRef<HTMLDivElement, ExpandableProps>(
  (
    {
      children,
      isExpanded,
      collapsedSize,
      expandedSize,
      className = '',
      onClick,
    },
    ref
  ) => {
    const [measureRef] = useMeasure();
    const animatedWidth = useMotionValue(collapsedSize.width);
    const animatedHeight = useMotionValue(collapsedSize.height);
    const smoothWidth = useSpring(animatedWidth, springConfig);
    const smoothHeight = useSpring(animatedHeight, springConfig);
    const smoothPadding = useSpring(0, springConfig);

    useEffect(() => {
      if (isExpanded) {
        animatedWidth.set(expandedSize.width);
        animatedHeight.set(expandedSize.height);
        smoothPadding.set(16);
      } else {
        // Delay shrinking to allow content to fade out
        const timer = setTimeout(() => {
          animatedWidth.set(collapsedSize.width);
          animatedHeight.set(collapsedSize.height);
          smoothPadding.set(0);
        }, 150); // delay start of shrink
        return () => clearTimeout(timer);
      }
    }, [isExpanded, collapsedSize, expandedSize, animatedWidth, animatedHeight, smoothPadding]);

    // Sync with Electron window
    useEffect(() => {
      if (isExpanded) {
        window.electronAPI?.expandIsland(expandedSize.width, expandedSize.height);
      } else {
         const timer = setTimeout(() => {
          window.electronAPI?.expandIsland(collapsedSize.width, collapsedSize.height);
        }, 650); // Wait for animation to finish completely
        return () => clearTimeout(timer);
      }
    }, [isExpanded, collapsedSize, expandedSize]);

    return (
      <motion.div
        ref={ref}
        className={className}
        style={{
          width: smoothWidth,
          height: smoothHeight,
          borderRadius: 24,
          padding: smoothPadding,
        }}
        onClick={onClick}
      >
        <div ref={measureRef} className="w-full h-full">
          {children}
        </div>
      </motion.div>
    );
  }
);

Expandable.displayName = 'Expandable';
