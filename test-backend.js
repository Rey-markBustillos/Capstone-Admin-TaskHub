// Quick test script to check if the upload endpoint is working
async function testUpload() {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
    });
    
    if (response.ok) {
      const users = await response.json();
      console.log('Backend is accessible. Users found:', users.length);
    } else {
      console.error('Backend not accessible:', response.status);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testUpload();