// src/utils/issues.js
export function deriveIssues(inputs) {
  const issues = [];

  const ph = num(inputs.ph);
  const turb = num(inputs.turbidity);
  const chlor = num(inputs.chloramines);
  const solids = num(inputs.solids);
  const sulfate = num(inputs.sulfate);

  if (isFinite(turb) && turb > 5) issues.push("High Turbidity");
  if (isFinite(ph) && ph < 6.5) issues.push("Low pH Levels");
  if (isFinite(ph) && ph > 8.5) issues.push("High pH Levels");
  if (isFinite(chlor) && chlor > 4) issues.push("High Chloramines");
  if (isFinite(solids) && solids > 500) issues.push("Excess Solids");
  if (isFinite(sulfate) && sulfate > 250) issues.push("High Sulfate");

  return issues;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
