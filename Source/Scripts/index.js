let plants = [];
let selectedPlant = null;
let fuse;

fetch('Source/Data/index.json')
    .then(response => response.json())
    .then(data => {
        plants = Array.isArray(data) ? data : data.plants || [];
        if (!Array.isArray(plants)) plants = [];
        fuse = new Fuse(plants, {
            keys: ['identification.common_names', 'identification.scientific_name', 'identification.family'],
            threshold: 0.3
        });
        renderPlantList();
        setupEventListeners();
    })
    .catch(error => console.error('Error loading index.json:', error));

function renderPlantList() {
    const searchTerm = document.querySelector('.form-control').value.trim();
    const selectedFilters = Array.from(document.querySelectorAll('#filters input:checked')).map(input => input.id === 'indoor' ? 'Indoor' : 'Outdoor');
    let displayedPlants = searchTerm ? fuse.search(searchTerm).map(result => result.item) : plants;
    if (selectedFilters.length) {
        displayedPlants = displayedPlants.filter(plant =>
            selectedFilters.some(filter => plant.classification.indoor_vs_outdoor === filter || plant.classification.indoor_vs_outdoor === 'Both')
        );
    }
    document.getElementById('plant-list').innerHTML = displayedPlants.map(plant => `
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2">
                    <div class="d-flex align-items-center gap-3 my-1">
                        <img class="avatar rounded flex-none" src="${plant.media.thumbnail}">
                        <div>
                            <span class="d-block text-heading text-sm fw-semibold">${plant.identification.common_names[0]}</span>
                            <span class="d-sm-block text-muted text-xs">${plant.identification.family}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-dark" data-plant-id="${plant.id}">View</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateInspectTab(plant) {
    const inspectBody = document.getElementById('inspect-body');
    inspectBody.innerHTML = plant ? `
        <p>Name: <span>${plant.identification.common_names[0]}</span></p>
        <p>Family: <span>${plant.identification.family}</span></p>
        <p>Ideal Temp Max: <span>${plant.care.temperature.max_f}°F</span></p>
        <p>Ideal Temp Min: <span>${plant.care.temperature.min_f}°F</span></p>
        <img class="avatar rounded flex-none" src="${plant.media.thumbnail}">
        ${plant.media.full_images.map(img => `<img class="avatar rounded flex-none" src="${img}">`).join('')}
    ` : `
        <p>No plant selected. Please select a plant from the Database tab.</p>
        <button class="btn btn-primary" id="go-to-database">Go to Database</button>
    `;
}

function setupEventListeners() {
    document.getElementById('plant-list').addEventListener('click', e => {
        if (e.target.classList.contains('btn-dark')) {
            selectedPlant = plants.find(p => p.id === e.target.dataset.plantId);
            updateInspectTab(selectedPlant);
            $('#inspect-tab').tab('show');
        }
    });
    document.querySelector('.form-control').addEventListener('input', renderPlantList);
    document.querySelectorAll('#filters input').forEach(input => input.addEventListener('change', renderPlantList));
    $('#filters-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    $('#inspect-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    document.addEventListener('click', e => {
        if (e.target.id === 'go-to-database') {
            $('#database-tab').tab('show');
        }
    });
}