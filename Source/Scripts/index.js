let plants = [];
let selectedPlant = null;
let fuse;

fetch('Source/Data/index.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch index.json');
        return response.json();
    })
    .then(data => {
        if (data.plant) {
            plants = [data.plant];
        } else if (Array.isArray(data)) {
            plants = data;
        } else if (data.plants) {
            plants = data.plants;
        } else {
            plants = [];
        }
        console.log('Loaded plants:', plants);
        if (!Array.isArray(plants)) plants = [];
        fuse = new Fuse(plants, {
            keys: ['identification.names', 'identification.scientific_name', 'identification.family'],
            threshold: 0.3,
            includeScore: true
        });
        renderPlantList();
        setupEventListeners();
    })
    .catch(error => console.error('Error loading index.json:', error));

function renderPlantList() {
    const searchTerm = document.querySelector('.form-control')?.value.trim() || '';
    const selectedFilters = Array.from(document.querySelectorAll('#filters input:checked')).map(input => input.id === 'indoor' ? 'Indoor' : 'Outdoor');
    let displayedPlants = searchTerm ? fuse.search(searchTerm).map(result => result.item) : plants.slice();

    if (selectedFilters.length) {
        displayedPlants = displayedPlants.filter(plant =>
            selectedFilters.some(filter => plant.classification?.placement === filter || plant.classification?.placement === 'Both')
        );
    }

    const plantList = document.getElementById('plant-list');
    if (!plantList) {
        console.error('Plant list container not found');
        return;
    }

    plantList.innerHTML = displayedPlants.length ? displayedPlants.map(plant => `
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2">
                    <div class="d-flex align-items-center gap-3 my-1">
                        <img class="avatar rounded flex-none" src="${plant.media?.thumbnail || 'https://placehold.co/50'}" alt="${plant.identification?.common_names?.[0] || 'Plant'}">
                        <div>
                            <span class="d-block text-heading text-sm fw-semibold">${plant.identification?.names?.[0] || 'Unknown'}</span>
                            <span class="d-sm-block text-muted text-xs">${plant.identification?.family || 'Unknown'}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-dark" data-plant-id="${plant.id}">View</button>
                </div>
            </div>
        </div>
    `).join('') : '<p>No plants found.</p>';
}

function updateInspectTab(plant) {
    const inspectBody = document.getElementById('inspect-body');
    if (!inspectBody) {
        console.error('Inspect body not found');
        return;
    }
    inspectBody.innerHTML = plant ? `
        <p>Name: <span>${plant.identification?.names?.[0] || 'Unknown'}</span></p>
        <p>Family: <span>${plant.identification?.family || 'Unknown'}</span></p>
        <p>Ideal Temp Max: <span>${plant.care?.temperature?.max_f || 'N/A'}°F</span></p>
        <p>Ideal Temp Min: <span>${plant.care?.temperature?.min_f || 'N/A'}°F</span></p>
        <img class="avatar rounded flex-none" src="${plant.media?.thumbnail || 'https://placehold.co/50'}" alt="${plant.identification?.names?.[0] || 'Plant'}">
        ${plant.media?.images?.map(img => `<img class="avatar rounded flex-none" src="${img}" alt="Plant image">`).join('') || ''}
    ` : `
        <p>No plant selected. Please select a plant from the Database tab.</p>
        <button class="btn btn-primary" id="go-to-database">Go to Database</button>
    `;
}

function setupEventListeners() {
    const plantList = document.getElementById('plant-list');
    if (plantList) {
        plantList.addEventListener('click', e => {
            if (e.target.classList.contains('btn-dark')) {
                selectedPlant = plants.find(p => p.id === e.target.dataset.plantId);
                updateInspectTab(selectedPlant);
                $('#inspect-tab').tab('show');
            }
        });
    }

    const searchInput = document.querySelector('.form-control');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderPlantList();
        });
    } else {
        console.error('Search input not found');
    }

    const filterInputs = document.querySelectorAll('#filters input');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            renderPlantList();
        });
    });

    $('#filters-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    $('#inspect-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    document.addEventListener('click', e => {
        if (e.target.id === 'go-to-database') {
            $('#database-tab').tab('show');
        }
    });
}