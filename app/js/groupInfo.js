async function load() {
    const params = new URLSearchParams(window.location.search);
    const groupNumber = Number(params.get('group'));

    const header = document.querySelector('.header');
    const memContainer = document.querySelector('.members-container');

    if (!groupNumber) {
        header.innerHTML = '<h1>Invalid group</h1>';
        memContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/api/groups/${groupNumber}`);

        if (!response.ok) {
            header.innerHTML = `<h1>Group ${groupNumber}</h1><p>Unable to load group data.</p>`;
            memContainer.innerHTML = '<div class="not-rated-card">Unable to load members. Please try again later.</div>';
            return;
        }

        const group = await response.json();

        if (!group || !group.members) {
            header.innerHTML = `<h1>Group ${groupNumber}</h1><p>No data available</p>`;
            memContainer.innerHTML = '<div class="not-rated-card">No members found for this group.</div>';
            return;
        }

        header.innerHTML = `
            <h1>Group Information</h1>
            <h3>Group ${group.groupNumber}</h3>
            <p><strong>Group Average Rating:</strong> ${group.groupAverageRating}</p>
        `;

        if (!group.members.length) {
            memContainer.innerHTML = '<div class="not-rated-card">No members in this group.</div>';
            return;
        }

        memContainer.innerHTML = '';
        group.members.forEach(member => {
            const memCard = document.createElement('div');
            memCard.className = 'student-card';
            memCard.innerHTML = `
                <h2>${member.fullName}</h2>
                <p>Average: ${member.studentAverage ?? 'N/A'}/40</p>

                <button>
                    View Rating
                </button>
            `;
            memContainer.appendChild(memCard);

            const ratingsButton = memCard.querySelector('button');
            ratingsButton.addEventListener('click', () => {
                window.location.href = `./student.html?studentId=${member.studentId}`;
            });
        });

    } catch (err) {
        header.innerHTML = `<h1>Group ${groupNumber}</h1><p>Network error</p>`;
        memContainer.innerHTML = '<div class="not-rated-card">Network error. Check your connection.</div>';
        console.error('Group load error:', err);
    }
}

load();