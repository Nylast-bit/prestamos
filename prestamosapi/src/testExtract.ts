async function test() {
  try {
    // Generate a valid token for testing (skip for now, we know auth works if /api/clientes works)
    // Wait, let's just make a script that prints what `res.json()` yields if we pass an object
    const data = { data: { PuntajeCredito: 650, CategoriaRiesgo: 'REGULAR' } };
    
    let clientScore = null;
    if (data?.data?.PuntajeCredito !== undefined) clientScore = data.data.PuntajeCredito;
    else if (data?.data?.score !== undefined) clientScore = data.data.score;
    else if (data?.PuntajeCredito !== undefined) clientScore = data.PuntajeCredito;
    else if (data?.score !== undefined) clientScore = data.score;
    else clientScore = null;

    console.log("clientScore is:", clientScore);
  } catch(e) {
    console.error(e);
  }
}
test();
