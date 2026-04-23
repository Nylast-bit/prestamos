const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2b$10$lo/m/brySk5WnT8vi05druyzz8Qw2aceJp7CLHKTZRb4v0c9nMPbC';
  const passwordsToTest = ['123', 'admin', 'admin123', 'password', '123456'];
  
  for(let p of passwordsToTest) {
    const isMatch = await bcrypt.compare(p, hash);
    console.log(`Password: ${p} - Match: ${isMatch}`);
  }
}
test();
