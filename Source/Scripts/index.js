let plants = [], selectedPlant = null, fuse, searchInput, plantList, resultsCount;

const filterConfig = [
    {
        group: 'Placement',
        attribute: 'classification.placement',
        includeBoth: true,
        filters: [
            { id: 'indoor', label: 'Indoor', value: 'Indoor' },
            { id: 'outdoor', label: 'Outdoor', value: 'Outdoor' }
        ]
    },
    {
        group: 'Category',
        attribute: 'classification.category',
        includeBoth: false,
        filters: [
            { id: 'succulent', label: 'Succulent', value: 'Succulent' },
            { id: 'tree', label: 'Tree', value: 'Tree' }
        ]
    }
];

fetch('Source/Data/index.json')
    .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch index.json'))
    .then(data => {
        plants = data.plant ? [data.plant] : Array.isArray(data) ? data : data.plants || [];
        if (!Array.isArray(plants)) plants = [];
        fuse = new Fuse(plants, { keys: ['identification.names', 'identification.scientific_name', 'identification.family'], threshold: 0.3 });
        [searchInput, plantList, resultsCount] = ['.form-control', '#plant-list', '#results-count'].map(q => document.querySelector(q));
        if (!searchInput || !plantList || !resultsCount) return console.error('Required DOM elements not found');
        generateFilterHTML();
        renderPlantList();
        setupEventListeners();
    })
    .catch(error => console.error('Error loading index.json:', error));

const generateFilterHTML = () => {
    document.getElementById('filters').innerHTML = filterConfig.map(group => `
        <div class="filter-group mb-3">
            <h4>${group.group}</h4>
            ${group.filters.map(filter => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="${filter.id}">
                    <label class="form-check-label" for="${filter.id}">${filter.label}</label>
                </div>
            `).join('')}
        </div>
    `).join('');
};

const renderPlantList = () => {
    const term = searchInput.value.trim();
    const results = term ? fuse.search(term).map(r => r.item) : plants;

    let filteredPlants = results;

    filterConfig.forEach(group => {
        const selectedValues = group.filters
            .filter(f => document.getElementById(f.id).checked)
            .map(f => f.value);
        if (selectedValues.length > 0) {
            if (group.includeBoth) {
                filteredPlants = filteredPlants.filter(plant =>
                    selectedValues.includes(plant[group.attribute]) || plant[group.attribute] === 'Both'
                );
            } else {
                filteredPlants = filteredPlants.filter(plant =>
                    selectedValues.includes(plant[group.attribute])
                );
            }
        }
    });

    plantList.innerHTML = filteredPlants.length ? filteredPlants.map(p => `
        <div class="col-lg-4 col-sm-6">
            <div class="card">
                <div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2">
                    <div class="d-flex align-items-center gap-3 my-1">
                        <img class="avatar rounded flex-none" src="${p.media?.thumbnail || 'https://placehold.co/50'}" alt="${p.identification?.names?.[0] || 'Plant'}">
                        <div>
                            <span class="d-block text-heading text-sm fw-semibold">${p.identification?.names?.[0] || 'Unknown'}</span>
                            <span class="d-sm-block text-muted text-xs">${p.identification?.family || 'Unknown'}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-dark" data-plant-id="${p.id}">View</button>
                </div>
            </div>
        </div>
    `).join('') : '<p>No plants found.</p>';
    resultsCount.innerHTML = `Showing ${filteredPlants.length} out of ${plants.length} plants`;
};

const updateInspectTab = plant => {
    const body = document.getElementById('inspect-body');
    if (!body) return;
    body.innerHTML = plant ? `
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
};

const setupEventListeners = () => {
    plantList.addEventListener('click', e => {
        if (e.target.classList.contains('btn-dark')) {
            selectedPlant = plants.find(p => p.id === e.target.dataset.plantId);
            updateInspectTab(selectedPlant);
            $('#inspect-tab').tab('show');
        }
    });
    searchInput.addEventListener('input', renderPlantList);
    document.getElementById('filters').addEventListener('change', renderPlantList);
    $('#filters-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    $('#inspect-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    document.addEventListener('click', e => e.target.id === 'go-to-database' && $('#database-tab').tab('show'));
};