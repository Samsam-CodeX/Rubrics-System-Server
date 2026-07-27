async function load() {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('studentId');

    const gotoStudents = document.getElementById('goto-students');
    gotoStudents.addEventListener('click', () => {
        window.location.href = 'allStudents.html';
    });

    const logout = document.getElementById('logout');
    logout.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    const groupsContainer = document.getElementById('groups-container');

    try {
        const response = await fetch('/api/dashboard');

        if (!response.ok) {
            groupsContainer.innerHTML = '<div class="not-rated-card">Unable to load dashboard. Please try again later.</div>';
            return;
        }

        const dbObject = await response.json();

        if (!Array.isArray(dbObject) || dbObject.length === 0) {
            groupsContainer.innerHTML = '<div class="not-rated-card">No groups found.</div>';
            return;
        }

        groupsContainer.innerHTML = '';
        dbObject.forEach(object => {
            const card = document.createElement('div');

            card.className = 'group-card';
            card.innerHTML = `
                <h1 style="margin: 0;">Group ${object.groupNumber}</h1>

                <p><strong>Average Rating:</strong> ${object.groupAverageRating ?? 'N/A'} / 40    ----------- ${(object.groupAverageRating * 100 / 40)}%
                </p>

                <div class="members">
                    <h2>Members</h2>

                </div>

                <button>
                    View Group
                </button>
            `;
            groupsContainer.appendChild(card);

            const members = card.querySelector('.members');
            if (Array.isArray(object.members) && object.members.length) {
                object.members.forEach(member => {
                    const memCard = document.createElement('div');
                    memCard.className = 'member';
                    memCard.innerHTML = `
                        <big><strong>${member.fullName}</strong></big>
                        <br>
                        <strong>Average:</strong> ${member.studentAverage ?? 'N/A'}/40   ----------- ${(member.studentAverage * 100 / 40)}%
                    `;
                    members.appendChild(memCard);
                });
            } else {
                members.innerHTML = '<div class="not-rated-card">No members data</div>';
            }

            const button = card.querySelector('button');
            button.addEventListener('click', () => {
                window.location.href = `./groupInfo.html?group=${object.groupNumber}`;
            });
        });

    } catch (err) {
        groupsContainer.innerHTML = '<div class="not-rated-card">Network error. Check your connection.</div>';
        console.error('Dashboard load error:', err);
    }
}

load();