let plants = [];
let selectedPlant = null;
let fuse;
let searchInput, plantList, resultsCount;

fetch('Source/Data/index.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch index.json');
        return response.json();
    })
    .then(data => {
        plants = data.plant ? [data.plant] : Array.isArray(data) ? data : data.plants || [];
        if (!Array.isArray(plants)) plants = [];
        fuse = new Fuse(plants, {
            keys: ['identification.common_names', 'identification.scientific_name', 'identification.family'],
            threshold: 0.3,
            includeScore: true
        });
        searchInput = document.querySelector('.form-control');
        plantList = document.getElementById('plant-list');
        resultsCount = document.getElementById('results-count');
        if (!searchInput || !plantList || !resultsCount) {
            console.error('Required DOM elements not found');
            return;
        }
        renderPlantList();
        setupEventListeners();
    })
    .catch(error => console.error('Error loading index.json:', error));

function renderPlantList() {
    const searchTerm = searchInput.value.trim();
    const selectedFilters = [...document.querySelectorAll('#filters input:checked')].map(input => input.id === 'indoor' ? 'Indoor' : 'Outdoor');
    let displayedPlants = searchTerm ? fuse.search(searchTerm).map(({ item }) => item) : plants;
    if (selectedFilters.length) {
        displayedPlants = displayedPlants.filter(plant => 
            plant.classification?.indoor_vs_outdoor === 'Both' || selectedFilters.includes(plant.classification?.indoor_vs_outdoor)
        );
    }
    plantList.innerHTML = displayedPlants.length ? displayedPlants.map(plant => `
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2">
                    <div class="d-flex align-items-center gap-3 my-1">
                        <img class="avatar rounded flex-none" src="${plant.media?.thumbnail || 'https://placehold.co/50'}" alt="${plant.identification?.common_names?.[0] || 'Plant'}">
                        <div>
                            <span class="d-block text-heading text-sm fw-semibold">${plant.identification?.common_names?.[0] || 'Unknown'}</span>
                            <span class="d-sm-block text-muted text-xs">${plant.identification?.family || 'Unknown'}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-dark" data-plant-id="${plant.id}">View</button>
                </div>
            </div>
        </div>
    `).join('') : '<p>No plants found.</p>';
    resultsCount.innerHTML = `Showing ${displayedPlants.length} out of ${plants.length} plants`;
}

function updateInspectTab(plant) {
    const inspectBody = document.getElementById('inspect-body');
    if (!inspectBody) return;
    inspectBody.innerHTML = plant ? `
        <p>Name: <span>${plant.identification?.common_names?.[0] || 'Unknown'}</span></p>
        <p>Family: <span>${plant.identification?.family || 'Unknown'}</span></p>
        <p>Ideal Temp Max: <span>${plant.care?.temperature?.max_f || 'N/A'}°F</span></p>
        <p>Ideal Temp Min: <span>${plant.care?.temperature?.min_f || 'N/A'}°F</span></p>
        <img class="avatar rounded flex-none" src="${plant.media?.thumbnail || 'https://placehold.co/50'}" alt="${plant.identification?.common_names?.[0] || 'Plant'}">
        ${plant.media?.full_images?.map(img => `<img class="avatar rounded flex-none" src="${img}" alt="Plant image">`).join('') || ''}
    ` : `
        <p>No plant selected. Please select a plant from the Database tab.</p>
        <button class="btn btn-primary" id="go-to-database">Go to Database</button>
    `;
}

function setupEventListeners() {
    plantList.addEventListener('click', e => {
        if (e.target.classList.contains('btn-dark')) {
            selectedPlant = plants.find(p => p.id === e.target.dataset.plantId);
            updateInspectTab(selectedPlant);
            $('#inspect-tab').tab('show');
        }
    });
    searchInput.addEventListener('input', renderPlantList);
    document.querySelectorAll('#filters input').forEach(input => 
        input.addEventListener('change', renderPlantList)
    );
    $('#filters-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    $('#inspect-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    document.addEventListener('click', e => {
        if (e.target.id === 'go-to-database') $('#database-tab').tab('show');
    });
}