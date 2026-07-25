async function load() {
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

        dbObject.forEach(object => {
            const card = document.createElement('div');

            card.className = 'group-card';
            card.innerHTML = `
                <h2>Group ${object.groupNumber}</h2>

                <p>Average Rating: ${object.groupAverageRating ?? 'N/A'} / 40</p>

                <div class="members">
                    <h3>Members</h3>

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
                        ${member.fullName}
                        <br>
                        Average: ${member.studentAverage ?? 'N/A'}/40
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