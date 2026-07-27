const registerBtn = document.getElementById('register');
const message = document.getElementById('message');

registerBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const studentId = document.getElementById('studentId').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const groupNumber = Number(document.getElementById('groupNumber').value);
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    await register(studentId, firstName, lastName, groupNumber, password, confirmPassword);
});

async function register(studentId, firstName, lastName, groupNumber, password, confirmPassword) {
    message.textContent = '';

    if (!studentId || !firstName || !lastName || !groupNumber || !password) {
        message.textContent = 'All fields are required.';
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match.';
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, firstName, lastName, groupNumber, password, chkpassword: confirmPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            message.textContent = data.error || 'Registration failed.';
            return;
        }

        // Success — redirect to login
        alert('Registration successful. Please login.');
        window.location.href = 'index.html';

    } catch (err) {
        console.error('Register request failed:', err);
        message.textContent = 'Unable to connect. Please try again later.';
    }
}