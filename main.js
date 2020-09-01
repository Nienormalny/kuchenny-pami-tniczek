window.onload = () => {
    console.log('HELLO FRIEND');
    // Odwołanie do elmentów w html
    const toggleBtn = document.getElementById('collapse-btn');
    const sidebar = document.querySelector('.sidebar');

    // Sidebar collapse event
    toggleBtn.addEventListener('click', e => sidebar.classList.toggle('collapsed'), true);
}