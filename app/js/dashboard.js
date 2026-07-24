async function load() {
    const groupsContainer = document.getElementById('groups-container');
    
    const response = await fetch("/api/dashboard");
    const dbObject = await response.json();


    dbObject.forEach(object => {
        const card = document.createElement('div');

        card.className = 'group-card';
        card.innerHTML = `
            <h2>Group ${object.groupNumber}</h2>

            <p>Average Rating: ${object.groupAverageRating} / 40</p>

            <div class="members">
                <h3>Members</h3>

            <!--Member Cards Here-->
            
            </div>

            <button>
                View Group
            </button>
        `;
        groupsContainer.appendChild(card);  /// the card layout template, no members just yet

        const members = card.querySelector('.members');
        object.members.forEach(member => {
            const memCard = document.createElement('div');
            memCard.className = 'member';
            memCard.innerHTML = `
                ${member.fullName}
                <br>
                Average: ${member.studentAverage}/40
            `;
            members.appendChild(memCard);
        })

    });
}
load();