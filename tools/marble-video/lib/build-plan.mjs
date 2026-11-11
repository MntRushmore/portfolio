import { planFromLabScore } from "./adapter.mjs";
import { addRails } from "./rails.mjs";
import { applyVoices } from "./themes.mjs";
export function buildPlan(score) {
  return applyVoices(addRails(planFromLabScore(score)));
}
