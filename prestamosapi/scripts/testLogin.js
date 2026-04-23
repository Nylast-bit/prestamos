async function login() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'carlos@gmail.com',
        password: '123'
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error("FAILED:", e.message);
  }
}

login();
