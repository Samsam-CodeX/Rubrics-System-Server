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
            <h2>Group ${group.groupNumber}</h2>
            <p><strong>Group Average Rating:</strong> ${group.groupAverageRating}/40 ----------- ${(group.groupAverageRating * 100 / 40)}%</p>
        `;

        if (!group.members.length) {
            memContainer.innerHTML = '<div class="student-card">No members in this group.</div>';
            return;
        }

        memContainer.innerHTML = '';
        group.members.forEach(member => {
            const memCard = document.createElement('div');
            memCard.className = 'student-card';
            memCard.innerHTML = `
                <h2>${member.fullName}</h2>
                <p><strong>Average:</strong> ${member.studentAverage ?? 'N/A'}/40   ----------- ${(member.studentAverage * 100 / 40)}%</p>
                <p><strong>Rated by:</strong> ${member.totalRaters} students</p>
                <button>
                    View Ratings
                </button>
            `;
            memContainer.appendChild(memCard);

            const ratingsButton = memCard.querySelector('button');
            ratingsButton.addEventListener('click', () => {
                window.location.href = `student?studentId=${member.studentId}`;
            });
        });

    } catch (err) {
        header.innerHTML = `<h1>Group ${groupNumber}</h1><p>Network error</p>`;
        memContainer.innerHTML = '<div class="not-rated-card">Network error. Check your connection.</div>';
        console.error('Group load error:', err);
    }
}

load();