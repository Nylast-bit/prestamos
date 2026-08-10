import { supabase } from "./config/supabaseClient";

async function test() {
  const { data: logs, error } = await supabase.from('ScoreLog').select('*');
  console.log("ScoreLogs Error:", error);
  console.log("ScoreLogs Data:", logs);
}
test();
