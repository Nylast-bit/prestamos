"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseClient_1 = require("./config/supabaseClient");
async function test() {
    const { data: logs, error } = await supabaseClient_1.supabase.from('ScoreLog').select('*');
    console.log("ScoreLogs Error:", error);
    console.log("ScoreLogs Data:", logs);
}
test();
