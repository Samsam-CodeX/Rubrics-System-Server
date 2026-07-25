async function loadForm() {
    const params = new URLSearchParams(window.location.search);
    const studentId = Number(params.get('studentId'));
    const groupNumber = params.get('group');
    const raterId = Number(params.get('raterId'));

    const studentName = document.getElementById('student-name');
    const studentGroup = document.getElementById('student-group');
    const message = document.getElementById('message');
    const form = document.getElementById('ratingForm');

    if (!studentId || !groupNumber || !raterId) {
        document.body.innerHTML = '<h1>Invalid rating request.</h1>';
        return;
    }

    try {
        const response = await fetch(`/api/students/${studentId}`);
        if (!response.ok) {
            document.body.innerHTML = '<h1>Student not found.</h1>';
            return;
        }

        const student = await response.json();
        studentName.textContent = `${student.firstName} ${student.lastName}`;
        studentGroup.textContent = `Group ${groupNumber}`;
    } catch (error) {
        console.error('Failed to load rating target:', error);
        document.body.innerHTML = '<h1>Unable to load student for rating.</h1>';
        return;
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        message.textContent = '';

        const formData = new FormData(form);
        const payload = {
            raterId,
            studentId,
            content_accuracy: Number(formData.get('content_accuracy')),
            understanding_topic: Number(formData.get('understanding_topic')),
            organization_structure: Number(formData.get('organization_structure')),
            delivery_communication: Number(formData.get('delivery_communication')),
            audience_engagement: Number(formData.get('audience_engagement')),
            visual_aids: Number(formData.get('visual_aids')),
            professional_appearance: Number(formData.get('professional_appearance')),
            teamwork: Number(formData.get('teamwork')),
            time_allocation: Number(formData.get('time_allocation')),
            strategy: Number(formData.get('strategy'))
        };

        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                message.textContent = data.error || 'Failed to submit rating.';
                message.style.color = 'red';
                return;
            }

            message.textContent = 'Rating submitted successfully. Redirecting...';
            message.style.color = '#16a34a';
            setTimeout(() => {
                window.location.href = `./student_GroupInfo.html?group=${groupNumber}&studentId=${raterId}`;
            }, 1200);
        } catch (error) {
            console.error('Rating submission failed:', error);
            message.textContent = 'Network error. Please try again.';
            message.style.color = 'red';
        }
    });
}

loadForm();