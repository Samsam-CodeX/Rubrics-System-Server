async function load() {
    
    try {
        const response = await fetch(`/api/student-dashboard`);

        if (!response.ok) {
            document.body.innerHTML = '<h1>Student dashboard not found</h1>';
            return;
        }

        const { student, groups } = await response.json();

        document.getElementById('student-name').textContent = student.fullName;
        document.getElementById('student-id').textContent = student.studentId;
        document.getElementById('student-group').textContent = `Group ${student.groupNumber}`;
        document.getElementById('student-average').textContent = `Average Rating: ${student.studentAverage ?? 'N/A'} / 40`;
        document.getElementById('student-raters').textContent = `Total Raters: ${student.totalRaters ?? 0}`;

        const groupsContainer = document.getElementById('groups-container');

        if (!groups || !groups.length) {
            groupsContainer.innerHTML = '<div class="not-rated-card">No groups available.</div>';
            return;
        }

        groupsContainer.innerHTML = '';

        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'group-card';

            card.innerHTML = `
                <div class="group-card-header">
                    <div>
                        <div class="group-name">Group ${group.groupNumber}</div>
                        <div class="members">${group.totalStudents} members</div>
                        <div class="status">Status: ${group.status}</div>
                        <div class="status">Progress: ${group.progress}</div>
                    </div>
                    <button type="button" ${group.status === 'Complete' ? 'disabled' : ''}>
                        ${group.status === 'Complete' ? 'Rated' : 'Rate Group'}
                    </button>
                </div>
            `;

            groupsContainer.appendChild(card);

            const button = card.querySelector('button');
            if (group.status !== 'Complete') {
                button.addEventListener('click', () => {
                    window.location.href = `student_GroupInfo?group=${group.groupNumber}`;
                });
            }
        });
    } catch (err) {
        document.body.innerHTML = '<h1>Network error. Please try again later.</h1>';
        console.error('Student dashboard load error:', err);
    }
}

load();
