const button = document.querySelector('button');
const message = document.getElementById('message');

button.addEventListener('click', async () => {
    const studentId = document.getElementById('studentId').value.trim();
    const password = document.getElementById('password').value.trim();

    await login(studentId, password);
});

async function login(studentId, password) {
    message.textContent = '';

    if (!studentId || !password) {
        message.textContent = 'Student ID and password are required.';
        return;
    }

    const userData = {
        studentId,
        password
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || 'Login failed. Please try again.';
            return;
        }

        window.location.href = `studentDashboard.html?studentId=${encodeURIComponent(studentId)}`;
    } catch (error) {
        console.error('Login request failed:', error);
        message.textContent = 'Unable to connect. Please try again later.';
    }
}