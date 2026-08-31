"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { capabilities } from "@/lib/content";
import styles from "./CapabilitySystem.module.css";

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 88;

// A radial node graph standing in for Capabilities' old plain `<dl>` — the
// clearest "convert to a visual system" case on the homepage. Every
// category from lib/content.ts becomes an orbiting node connected to a
// central hub; the actual capability text lives, unabridged, in the group
// list beside it — the diagram is a wayfinding/emphasis layer, never the
// only way to read the content, so nothing depends on hover to be
// understood. Hovering or focusing a node highlights its connecting line
// and matching group; nothing else moves. Real content only — five
// categories, real items, nothing invented.
export default function CapabilitySystem() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const n = capabilities.length;

  const nodes = capabilities.map((group, i) => {
    // Start at the top (-90deg) and go clockwise, evenly spaced.
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = CENTER + Math.cos(angle) * RADIUS;
    const y = CENTER + Math.sin(angle) * RADIUS;
    return { ...group, x, y };
  });

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.diagram}
        data-selecting={activeIndex !== null}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Capability system: ${capabilities.map((c) => c.category).join(", ")}`}
      >
        {nodes.map((node, i) => (
          <line
            key={`line-${node.category}`}
            className={styles.line}
            data-active={activeIndex === i}
            x1={CENTER}
            y1={CENTER}
            x2={node.x}
            y2={node.y}
          />
        ))}
        <circle className={styles.hub} cx={CENTER} cy={CENTER} r={14} />
        <text className={styles.hubLabel} x={CENTER} y={CENTER + 2.5}>
          SYS
        </text>
        {/* A small signal traveling out to whichever node is active and
            back — reinforcing "the hub is talking to this node right now"
            rather than just a static highlighted line. Native SVG
            animateMotion (no per-frame JS, no React state), mounted only
            while a node is active so it restarts fresh each time, and
            omitted entirely under reduced motion. */}
        {!reduced && activeIndex !== null && (
          <circle className={styles.packet} r={2.2}>
            <animateMotion
              dur="0.7s"
              repeatCount="indefinite"
              path={`M ${CENTER},${CENTER} L ${nodes[activeIndex].x},${nodes[activeIndex].y} L ${CENTER},${CENTER}`}
            />
          </circle>
        )}
        {nodes.map((node, i) => (
          <g
            key={node.category}
            className={styles.node}
            data-active={activeIndex === i}
            tabIndex={0}
            role="button"
            aria-label={`${node.category}: ${node.items.join(", ")}`}
            aria-pressed={activeIndex === i}
            onPointerEnter={() => setActiveIndex(i)}
            onPointerLeave={() => setActiveIndex((cur) => (cur === i ? null : cur))}
            onFocus={() => setActiveIndex(i)}
            onBlur={() => setActiveIndex((cur) => (cur === i ? null : cur))}
          >
            <circle className={styles.nodeDot} cx={node.x} cy={node.y} r={5} />
            <text
              className={styles.nodeLabel}
              x={node.x}
              y={node.y + (node.y > CENTER ? 16 : -10)}
              textAnchor="middle"
            >
              {node.category}
            </text>
          </g>
        ))}
      </svg>
      <dl className={styles.groups} data-selecting={activeIndex !== null}>
        {capabilities.map((group, i) => (
          <div className={styles.group} key={group.category} data-active={activeIndex === i}>
            <dt className={styles.groupLabel}>{group.category}</dt>
            <dd className={styles.groupItems}>{group.items.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
