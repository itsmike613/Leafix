let plants = [], selectedPlant = null, fuse, searchInput, plantList, resultsCount;
const plantsMap = {}, filterElements = {};

const filterConfig = [
    { group: 'Placement', attribute: 'classification.placement', includeBoth: true, filters: ['Indoor', 'Outdoor'] },
    { group: 'Category', attribute: 'classification.category', includeBoth: false, filters: ['Succulent', 'Tree'] }
];

const debounce = (func, delay) => {
    let timeout;
    return (...args) => (clearTimeout(timeout), timeout = setTimeout(() => func(...args), delay));
};

fetch('Source/Data/index.json')
    .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch index.json'))
    .then(data => {
        plants = Array.isArray(data) ? data : data.plant ? [data.plant] : data.plants || [];
        plants.forEach(p => plantsMap[p.id] = p);
        fuse = new Fuse(plants, { keys: ['identification.names', 'identification.scientific_name', 'identification.family'], threshold: 0.3 });
        [searchInput, plantList, resultsCount] = ['.form-control', '#plant-list', '#results-count'].map(q => document.querySelector(q));
        if (!searchInput || !plantList || !resultsCount) throw new Error('Required DOM elements not found');
        document.getElementById('filters').innerHTML = filterConfig.map(g => `
            <div class="filter-group mb-3">
                <h4>${g.group}</h4>
                ${g.filters.map(f => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id=${f.toLowerCase()}>
                        <label class="form-check-label" for=${f.toLowerCase()}>${f}</label>
                    </div>
                `).join('')}
            </div>
        `).join('');
        filterConfig.forEach(g => g.filters.forEach(f => filterElements[f.toLowerCase()] = document.getElementById(f.toLowerCase())));
        renderPlantList();
        setupEventListeners();
    })
    .catch(error => console.error('Error:', error));

const renderPlantList = () => {
    const term = searchInput.value.trim();
    let filteredPlants = term ? fuse.search(term).map(r => r.item) : plants;
    filterConfig.forEach(g => {
    const selected = g.filters.filter(f => filterElements[f.toLowerCase()].checked);
    if (selected.length) filteredPlants = filteredPlants.filter(p => selected.includes(p[g.attribute]) || (g.includeBoth && p[g.attribute] === 'Both'));});
    plantList.innerHTML = filteredPlants.length ? filteredPlants.map(p => {
        const name = p.identification?.names?.[0] || 'Unknown', thumb = p.media?.thumbnail || 'https://placehold.co/50';
        return `<div class="col-lg-4 col-sm-6"><div class="card"><div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2"><div class="d-flex align-items-center gap-3 my-1"><img class="avatar rounded flex-none" src="${thumb}" alt="${name}"><div><span class="d-block text-heading text-sm fw-semibold">${name}</span><span class="d-sm-block text-muted text-xs">${p.identification?.family || 'Unknown'}</span></div></div><button class="btn btn-sm btn-dark" data-action="view-plant" data-plant-id="${p.id}">View</button></div></div></div>`;
    }).join('') : '<p>No plants found.</p>';
    resultsCount.textContent = `Showing ${filteredPlants.length} of ${plants.length} plants`;
};

const updateInspectTab = plant => {
    const body = document.getElementById('inspect-body');
    if (!body) return;
    body.innerHTML = plant ? (() => {
        const name = plant.identification?.names?.[0] || 'Unknown', thumb = plant.media?.thumbnail || 'https://placehold.co/50';
        return `<p>Name: <span>${name}</span></p><p>Family: <span>${plant.identification?.family || 'Unknown'}</span></p><p>Ideal Temp Max: <span>${plant.care?.temperature?.max_f || 'N/A'}°F</span></p><p>Ideal Temp Min: <span>${plant.care?.temperature?.min_f || 'N/A'}°F</span></p><img class="avatar rounded flex-none" src="${thumb}" alt="${name}">${plant.media?.images?.map(img => `<img class="avatar rounded flex-none" src="${img}" alt="Plant image">`).join('') || ''}`;
    })() : '<p>No plant selected. Please select a plant from the Database tab.</p><button class="btn btn-primary" id="go-to-database">Go to Database</button>';
};

const setupEventListeners = () => {
    plantList.addEventListener('click', e => {
        if (e.target.dataset.action === 'view-plant') {
            selectedPlant = plantsMap[e.target.dataset.plantId];
            updateInspectTab(selectedPlant);
            $('#inspect-tab').tab('show');
        }
    });
    searchInput.addEventListener('input', debounce(renderPlantList, 300));
    document.getElementById('filters').addEventListener('change', renderPlantList);
    $('#filters-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    $('#inspect-tab').on('shown.bs.tab', () => updateInspectTab(selectedPlant));
    document.addEventListener('click', e => e.target.id === 'go-to-database' && $('#database-tab').tab('show'));
};