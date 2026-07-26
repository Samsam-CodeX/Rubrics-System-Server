async function load() {
    const params = new URLSearchParams(window.location.search);
    const groupNumber = Number(params.get('group'));
    const raterId = Number(params.get('studentId'));


    const panel = document.getElementById('panel');
    panel.innerHTML = `
        <a href="studentDashboard.html?studentId=${raterId}">
            ← Back to dashboard
        </a>
    `;

    const infoText = document.getElementById('group-info');
    const membersContainer = document.getElementById('members-container');

    if (!groupNumber || !raterId) {
        infoText.textContent = 'Invalid group or student selected.';
        return;
    }

    try {
        const response = await fetch(`/api/groups/${groupNumber}?raterId=${raterId}`);

        if (!response.ok) {
            infoText.textContent = `Unable to load group ${groupNumber}.`;
            return;
        }

        const group = await response.json();

        infoText.textContent = `Group ${group.groupNumber} — choose a student to rate.`;

        if (!group.members || !group.members.length) {
            membersContainer.innerHTML = '<div>No members available for rating.</div>';
            return;
        }

        membersContainer.innerHTML = '';
        group.members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';

            const isSelf = member.studentId === raterId;
            const hasRated = member.ratedByMe;
            const buttonDisabled = isSelf || hasRated;
            const buttonText = isSelf ? 'Yourself' : hasRated ? 'Rated' : 'Rate Student';

            card.innerHTML = `
                <h2>${member.fullName}</h2> 
                <p><strong>Student ID:</strong> ${member.studentId}</p>
                <p><strong>Group:</strong> ${group.groupNumber}</p>
                <button class="${buttonDisabled ? 'disabled' : ''}" ${buttonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            `;

            const button = card.querySelector('button');
            if (!buttonDisabled) {
                button.addEventListener('click', () => {
                    window.location.href = `./ratingForm.html?studentId=${member.studentId}&group=${group.groupNumber}&raterId=${raterId}`;
                });
            }

            membersContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Student group info load error:', err);
        infoText.textContent = 'Network error while loading group members.';
    }
}

load();
