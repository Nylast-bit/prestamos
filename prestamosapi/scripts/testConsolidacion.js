async function test() {
  // Login first
  const login = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'info@prestamospapito.com', password: 'admin123' })
  });
  const loginData = await login.json();
  console.log("Login:", loginData.token ? "OK" : "FAIL");

  // Test consolidacion activa
  const res = await fetch('http://localhost:3001/api/consolidacioncapital/activa', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  console.log("Status:", res.status);
  const body = await res.text();
  console.log("Body:", body);
}
test();
