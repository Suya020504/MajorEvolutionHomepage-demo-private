"use client";

import type { CSSProperties } from "react";

function point(index: number, value: number, count: number, radius: number, center: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
  const scaled = (value / 100) * radius;
  return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
}

export function RadarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const center = 120;
  const radius = 72;
  const gridValues = [25, 50, 75, 100];
  const polygon = values.map((value, index) => point(index, value, values.length, radius, center)).join(" ");
  return (
    <figure className="radar-card">
      <svg viewBox="0 0 240 240" role="img" aria-labelledby="radar-title radar-description">
        <title id="radar-title">전공 DNA 역량 연결도</title>
        <desc id="radar-description">{labels.map((label, index) => `${label} ${values[index]}점`).join(", ")}</desc>
        {gridValues.map((grid) => (
          <polygon key={grid} className="radar-grid" points={values.map((_, index) => point(index, grid, values.length, radius, center)).join(" ")} />
        ))}
        {values.map((_, index) => {
          const outer = point(index, 100, values.length, radius, center).split(",");
          return <line key={index} className="radar-axis" x1={center} y1={center} x2={outer[0]} y2={outer[1]} />;
        })}
        <polygon className="radar-value" points={polygon} />
        {values.map((value, index) => {
          const [x, y] = point(index, value, values.length, radius, center).split(",");
          return <circle key={index} className="radar-dot" cx={x} cy={y} r="3.5" />;
        })}
        {labels.map((label, index) => {
          const [xValue, yValue] = point(index, 121, labels.length, radius, center).split(",").map(Number);
          return <text key={label} x={xValue} y={yValue} textAnchor="middle" dominantBaseline="middle">{label}</text>;
        })}
      </svg>
      <figcaption>
        {labels.map((label, index) => <span key={label}>{label} <strong>{values[index]}</strong></span>)}
      </figcaption>
    </figure>
  );
}
export function ScoreRing({ score, label = "추천 적합도", compact = false }: { score: number; label?: string; compact?: boolean }) {
  return (
    <div
      className={`score-ring${compact ? " score-ring--compact" : ""}`}
      style={{ "--score": `${score * 3.6}deg` } as CSSProperties}
      role="img"
      aria-label={`${label} ${score}점`}
    >
      <div><strong>{score}</strong><span>{label}</span></div>
    </div>
  );
}

export function CriteriaBar({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return (
    <div className={`criteria-bar${emphasized ? " is-emphasized" : ""}`}>
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="criteria-bar__track"><span style={{ "--value": `${value}%` } as CSSProperties} /></div>
    </div>
  );
}
