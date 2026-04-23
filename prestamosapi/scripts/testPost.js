async function test() {
  try {
    const login = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'info@prestamospapito.com', password: 'admin123' }) // The auto-generated admin for empresa 3
    });
    const loginData = await login.json();
    if (!loginData.token) throw new Error("Can't login");
    
    console.log("Logged in");

    const res = await fetch('http://localhost:3001/api/prestatarios', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        Nombre: 'Pedro Prestamista Test',
        Clave: '123456'
      })
    });
    const txt = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", txt);
  } catch (e) {
    console.error(e.message);
  }
}
test();
