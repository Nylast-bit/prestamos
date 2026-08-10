import { recalcularScoreService } from "./config/../services/score.service";

async function test() {
  console.log("Recalculating score for client 14, empresa 1...");
  try {
    const res = await recalcularScoreService("14", 1);
    console.log("Recalculation result:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}

test();
