"use client";

import { useEffect, type RefObject } from "react";

const MIN_SPEED = 0.22;
const MAX_SPEED = 1.5;
const REPEL_RADIUS = 130;
const PADDING = 18;

interface TileState {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Drives the homepage chaos tiles: scatter, drift, bounce, rotate/pulse and
 * pointer repulsion. Ported from the static mockup's rAF loop and disabled for
 * users who prefer reduced motion.
 */
export function useChaosStage(
  stageRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const tiles = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-chaos-tile]"),
    );
    if (tiles.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const state: TileState[] = tiles.map((element) => ({
      element,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      spin: 0,
      phase: 0,
    }));

    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let tileSize = 56;
    let rafId = 0;
    let lastTime = 0;
    let resizeTimer = 0;

    const render = (time: number, animate: boolean) => {
      const still = !animate || reduceMotion.matches;

      state.forEach((item) => {
        const scale = still
          ? 1
          : 1 + Math.sin(time / 900 + item.phase) * 0.045;

        item.element.style.transform =
          `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0) ` +
          `rotate(${item.rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });
    };

    const scatter = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      tileSize = tiles[0]?.offsetWidth || 56;

      const maxX = Math.max(0, width - tileSize - PADDING);
      const maxY = Math.max(0, height - tileSize - PADDING);

      const columns = 3;
      const rows = Math.ceil(state.length / columns);
      const stepX =
        columns > 1 ? Math.max(0, maxX - PADDING) / (columns - 1) : 0;
      const stepY =
        rows > 1 ? Math.max(0, maxY - PADDING) / (rows - 1) : 0;
      const slots: { x: number; y: number }[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          slots.push({
            x: PADDING + column * stepX,
            y: rows > 1 ? PADDING + row * stepY : (height - tileSize) / 2,
          });
        }
      }

      for (let i = slots.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }

      state.forEach((item, index) => {
        const slot = slots[index];
        item.x = clamp(
          slot.x + randomBetween(-10, 10),
          PADDING,
          Math.max(PADDING, maxX),
        );
        item.y = clamp(
          slot.y + randomBetween(-10, 10),
          PADDING,
          Math.max(PADDING, maxY),
        );
        item.vx = randomBetween(-0.5, 0.5);
        item.vy = randomBetween(-0.5, 0.5);
        item.rotation = randomBetween(-12, 12);
        item.spin = randomBetween(-0.16, 0.16);
        item.phase = Math.random() * Math.PI * 2;
      });

      for (let pass = 0; pass < 30; pass += 1) {
        for (let i = 0; i < state.length; i += 1) {
          for (let j = i + 1; j < state.length; j += 1) {
            const a = state[i];
            const b = state[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.001;
            const minDistance = tileSize + 12;

            if (distance >= minDistance) continue;

            const push = (minDistance - distance) / 2;
            const nx = dx / distance;
            const ny = dy / distance;

            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }

        state.forEach((item) => {
          item.x = clamp(item.x, PADDING, Math.max(PADDING, maxX));
          item.y = clamp(item.y, PADDING, Math.max(PADDING, maxY));
        });
      }

      render(performance.now(), false);
    };

    const tick = (time: number) => {
      const delta = clamp((time - lastTime) / 16.667, 0.4, 3);
      lastTime = time;

      const maxX = Math.max(0, width - tileSize - PADDING);
      const maxY = Math.max(0, height - tileSize - PADDING);
      const minX = Math.min(PADDING, maxX);
      const minY = Math.min(PADDING, maxY);

      state.forEach((item) => {
        item.x += item.vx * delta;
        item.y += item.vy * delta;

        if (item.x <= minX) {
          item.x = minX;
          item.vx = Math.abs(item.vx) + 0.04;
        } else if (item.x >= maxX) {
          item.x = maxX;
          item.vx = -Math.abs(item.vx) - 0.04;
        }

        if (item.y <= minY) {
          item.y = minY;
          item.vy = Math.abs(item.vy) + 0.04;
        } else if (item.y >= maxY) {
          item.y = maxY;
          item.vy = -Math.abs(item.vy) - 0.04;
        }

        if (pointer.active) {
          const centerX = item.x + tileSize / 2;
          const centerY = item.y + tileSize / 2;
          const dx = centerX - pointer.x;
          const dy = centerY - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0.01 && distance < REPEL_RADIUS) {
            const force = (1 - distance / REPEL_RADIUS) * 0.7;
            item.vx += (dx / distance) * force * delta;
            item.vy += (dy / distance) * force * delta;
          }
        }

        const speed = Math.hypot(item.vx, item.vy);

        if (speed > MAX_SPEED) {
          item.vx = (item.vx / speed) * MAX_SPEED;
          item.vy = (item.vy / speed) * MAX_SPEED;
        } else if (speed < MIN_SPEED) {
          const angle =
            speed > 0.001
              ? Math.atan2(item.vy, item.vx)
              : Math.random() * Math.PI * 2;
          item.vx = Math.cos(angle) * MIN_SPEED;
          item.vy = Math.sin(angle) * MIN_SPEED;
        }

        item.rotation += item.spin * delta;

        if (item.rotation > 16) {
          item.rotation = 16;
          item.spin = -Math.abs(item.spin);
        } else if (item.rotation < -16) {
          item.rotation = -16;
          item.spin = Math.abs(item.spin);
        }
      });

      render(time, true);
      rafId = window.requestAnimationFrame(tick);
    };

    const animate = () => {
      scatter();
      if (reduceMotion.matches) return;

      window.cancelAnimationFrame(rafId);
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(scatter, 160);
    };

    const handleReducedMotion = () => {
      window.cancelAnimationFrame(rafId);

      if (reduceMotion.matches) {
        scatter();
      } else {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerup", handlePointerLeave);
    window.addEventListener("resize", handleResize);
    reduceMotion.addEventListener("change", handleReducedMotion);

    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(resizeTimer);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerup", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      reduceMotion.removeEventListener("change", handleReducedMotion);
    };
  }, [stageRef]);
}
