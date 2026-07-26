async function removeStudent(studentId, studentName, card) {
    if (!confirm(`Remove ${studentName} from the database? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to remove student.');
            return;
        }

        card.remove();
    } catch (error) {
        console.error('Delete student failed:', error);
        alert('Unable to remove student. Check your connection and try again.');
    }
}

async function loadStudents() {
    const grid = document.getElementById('students-grid');

    try {
        const response = await fetch('/api/students');
        if (!response.ok) {
            grid.innerHTML = '<div class="empty-state">Unable to load students. Please try again later.</div>';
            return;
        }

        const students = await response.json();

        if (!Array.isArray(students) || students.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found.</div>';
            return;
        }

        grid.innerHTML = '';

        students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div>
                    <h3>${student.lastName}, ${student.firstName}</h3>
                    <p class="student-info">Student ID: ${student.studentId}</p>
                </div>
                <div class="details">
                    <div>Group: ${student.groupNumber}</div>
                    <div>Average: ${student.studentAverage ?? 'N/A'} / 40</div>
                </div>
                <div class="actions">
                    <button type="button" class="button view-button">View student</button>
                    <button type="button" class="button delete-button">Remove student</button>
                </div>
            `;

            const deleteButton = card.querySelector('.delete-button');
            deleteButton.addEventListener('click', () => removeStudent(student.studentId, student.fullName, card));

            const viewButton = card.querySelector('.view-button');
            viewButton.addEventListener('click', () => {
                window.location.href = `student.html?studentId=${encodeURIComponent(student.studentId)}`;
            });

            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load students:', error);
        grid.innerHTML = '<div class="empty-state">Network error while loading students.</div>';
    }
}

loadStudents();
