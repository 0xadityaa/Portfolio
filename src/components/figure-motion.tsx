"use client";

import { useEffect } from "react";

/**
 * Plays each animated blog figure (.viz, see docs/visuals.md) once, the first
 * time it scrolls into view. Without JavaScript, or with reduced motion, the
 * figure is never touched and simply shows its final frame.
 */
export function FigureMotion() {
  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>("article .viz");
    if (!figures.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const figure = entry.target as HTMLElement;
          observer.unobserve(figure);
          figure.classList.add("in-view");
          figure.querySelectorAll<SVGTextElement>("[data-count]").forEach(tick);
        }
      },
      { threshold: 0.35 }
    );
    figures.forEach((figure) => {
      figure.classList.add("js-anim");
      observer.observe(figure);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}

/** Number tick: counts from data-from (default 0) to data-count, in step with the element's --d and --t. */
function tick(el: SVGTextElement) {
  const seconds = (name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;
  const to = Number(el.dataset.count);
  const from = Number(el.dataset.from ?? 0);
  const dec = Number(el.dataset.dec ?? 0);
  const { pre = "", suf = "" } = el.dataset;
  const delay = seconds("--d") * 1000;
  const length = seconds("--t") * 1000 || 800;
  const final = el.textContent;
  const show = (value: number) => {
    el.textContent = `${pre}${value.toLocaleString("en-US", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })}${suf}`;
  };
  show(from);
  let start = 0;
  const frame = (now: number) => {
    start ||= now;
    const t = Math.min(1, (now - start) / length);
    if (t < 1) {
      show(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      requestAnimationFrame(frame);
    } else el.textContent = final;
  };
  setTimeout(() => requestAnimationFrame(frame), delay);
}
