async function load() {

    const params = new URLSearchParams(window.location.search);
    const studentId = Number(params.get('studentId'));

    if (!studentId) {
        document.body.innerHTML = '<h1>Invalid student ID</h1>';
        return;
    }

    try {
        const response = await fetch(`/api/students/${studentId}/ratings`);

        if (!response.ok) {
            document.body.innerHTML = '<h1>Student not found</h1>';
            return;
        }

        const { student, ratings, notRated } = await response.json();

        document.getElementById('student-name').textContent = student.fullName;
        document.getElementById('student-average').textContent = `Average Rating: ${student.studentAverage ?? 'N/A'} / 40  ----------- ${(student.studentAverage * 100 / 40)}%`;
        document.getElementById('student-raters').textContent = `Total Raters: ${student.totalRaters ?? 0}`;

        const ratingsContainer = document.getElementById('ratings-container');
        const notRatedContainer = document.getElementById('not-rated-container');
        const panel = document.getElementById('panel');


        panel.innerHTML = `

        <a href="groupInfo.html?group=${student.groupNumber}" class="back">
            See group
        </a>
    
        <a href="dashboard.html" class="back">
            Back to dashboard
        </a>

        `;



        if (!ratings || !ratings.length) {
            ratingsContainer.innerHTML = '<div class="not-rated-card">No ratings yet</div>';
        } else {
            ratingsContainer.innerHTML = '';
            ratings.forEach(rating => {
                const row = document.createElement('div');
                row.className = 'rating-row';
                row.innerHTML = `
                    <div>${rating.raterName}</div>
                    <div>${rating.content_accuracy}</div>
                    <div>${rating.understanding_topic}</div>
                    <div>${rating.organization_structure}</div>
                    <div>${rating.delivery_communication}</div>
                    <div>${rating.audience_engagement}</div>
                    <div>${rating.visual_aids}</div>
                    <div>${rating.professional_appearance}</div>
                    <div>${rating.teamwork}</div>
                    <div>${rating.time_allocation}</div>
                    <div>${rating.strategy}</div>
                    <div><strong>${rating.totalScore} / 40</strong></div>
                `;
                ratingsContainer.appendChild(row);
            });
        }

        if (!notRated || !notRated.length) {
            notRatedContainer.innerHTML = '<div class="not-rated-card">Everyone has rated this student</div>';
        } else {
            notRatedContainer.innerHTML = '';
            notRated.forEach(person => {
                const card = document.createElement('div');
                card.className = 'not-rated-card';
                card.textContent = person.fullName;
                notRatedContainer.appendChild(card);
            });
        }

    } catch (err) {
        document.body.innerHTML = '<h1>Network error. Please try again later.</h1>';
        console.error('Student load error:', err);
    }
}

load();