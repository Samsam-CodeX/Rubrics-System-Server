const adminForm = document.getElementById('adminForm');
const accessInput = document.getElementById('code');
const message = document.getElementById('message');

adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const accessCode = accessInput.value.trim();
    await enter(accessCode);
});

async function enter(accessCode) {
    message.textContent = '';

    if (!accessCode) {
        message.textContent = 'Access code is required.';
        return;
    }

    try {
        const res = await fetch('/api/auth/access_admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessCode })
        });

        const data = await res.json();

        if (!res.ok) {
            message.textContent = data.error || 'Invalid access code.';
            return;
        }

        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error('Access code request failed:', err);
        message.textContent = 'Unable to connect. Server error.';
    }
}



