import cron from "node-cron";

// Corre todos los días a medianoche
cron.schedule("* */30 * * * *", () => {
  const today = new Date();
  const day = today.getDate();

  if (day === 8 || day === 23) {
    console.log(`✅ Consolidación detectada para el día ${day}.`);
  } else {
    console.log(`ℹ️ Hoy es ${day}, no toca consolidación.`);
  }
});


console.log("⏰ Job de consolidación inicializado (ejecuta a medianoche).");
