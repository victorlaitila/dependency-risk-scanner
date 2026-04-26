import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  TOOLTIP_VIEWPORT_GAP_PX,
  TOOLTIP_VIEWPORT_MARGIN_PX,
  TOOLTIP_Z_INDEX,
} from "@/lib/constants";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

export const Tooltip = ({ content, children, side = "top" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; side: TooltipProps["side"] }>({
    left: 0,
    top: 0,
    side,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      if (!triggerRect || !tooltipRect) {
        return;
      }

      const margin = TOOLTIP_VIEWPORT_MARGIN_PX;
      const gap = TOOLTIP_VIEWPORT_GAP_PX;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const oppositeSide: Record<NonNullable<TooltipProps["side"]>, NonNullable<TooltipProps["side"]>> = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      };

      const uniqueSides = [side, oppositeSide[side], "top", "bottom", "right", "left"].filter(
        (value, index, arr) => arr.indexOf(value) === index,
      ) as NonNullable<TooltipProps["side"]>[];

      const getCandidatePosition = (candidateSide: NonNullable<TooltipProps["side"]>) => {
        if (candidateSide === "top") {
          return {
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
            top: triggerRect.top - gap - tooltipRect.height,
          };
        }
        if (candidateSide === "bottom") {
          return {
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
            top: triggerRect.bottom + gap,
          };
        }
        if (candidateSide === "left") {
          return {
            left: triggerRect.left - gap - tooltipRect.width,
            top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
          };
        }
        return {
          left: triggerRect.right + gap,
          top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        };
      };

      const fitsViewport = (left: number, top: number) =>
        left >= margin &&
        top >= margin &&
        left + tooltipRect.width <= viewportWidth - margin &&
        top + tooltipRect.height <= viewportHeight - margin;

      let resolvedSide = side;
      let { left, top } = getCandidatePosition(side);

      for (const candidateSide of uniqueSides) {
        const candidate = getCandidatePosition(candidateSide);
        if (fitsViewport(candidate.left, candidate.top)) {
          resolvedSide = candidateSide;
          left = candidate.left;
          top = candidate.top;
          break;
        }
      }

      const clampedLeft = Math.min(
        Math.max(left, margin),
        Math.max(margin, viewportWidth - tooltipRect.width - margin),
      );
      const clampedTop = Math.min(
        Math.max(top, margin),
        Math.max(margin, viewportHeight - tooltipRect.height - margin),
      );

      setPosition({ left: clampedLeft, top: clampedTop, side: resolvedSide });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, side]);

  const arrowPositionClasses = {
    top: "-bottom-1 left-1/2 -translate-x-1/2 rotate-45",
    bottom: "-top-1 left-1/2 -translate-x-1/2 rotate-45",
    left: "-right-1 top-1/2 -translate-y-1/2 rotate-45",
    right: "-left-1 top-1/2 -translate-y-1/2 rotate-45",
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed whitespace-normal break-words rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground shadow-md"
            style={{ left: position.left, top: position.top, maxWidth: "min(22rem, calc(100vw - 1rem))", zIndex: TOOLTIP_Z_INDEX }}
          >
            {content}
            <div
              className={`absolute h-2 w-2 border-r border-b border-border bg-background ${arrowPositionClasses[position.side]}`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
