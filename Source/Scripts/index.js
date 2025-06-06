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
        fuse = new Fuse(plants, { keys: ['identification.names', 'identification.sci_name', 'identification.family'], threshold: 0.3 });
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
        return `<div class="col-lg-4 col-sm-6"><div class="card"><div class="p-3 d-flex align-items-center justify-content-between gap-6 border-0 py-2"><div class="d-flex align-items-center gap-3 my-1"><img class="avatar" src="${thumb}" alt="${name}"><div><span class="d-block text-heading text-sm fw-semibold">${name}</span><span class="d-sm-block text-muted text-xs">${p.identification?.family || 'Unknown'}</span></div></div><button class="btn btn-sm btn-dark" data-action="view-plant" data-plant-id="${p.id}">View</button></div></div></div>`;
    }).join('') : '<p>No plants found.</p>';
    resultsCount.textContent = `Showing ${filteredPlants.length} of ${plants.length} plants`;
};

const updateInspectTab = plant => {
    const body = document.getElementById('inspect-body');
    if (!body) return;
    body.innerHTML = plant ? (() => {
        return `
            <div class="card mb-5">
                <div class="card-body">
                    <div class="row g-0">
                        <div class="col">
                            <div class="d-flex align-items-center gap-3">
                                <img class="avatar" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSC1pIa2-QI_FUzIWc7FYOn2lbY8U3g0v9_30IBSms5e_tPl9xNDRPhgoaw_aXBdirm3Ug&usqp=CAU">
                                <div>
                                    <span class="d-block text-heading text-sm fw-semibold">${plant.identification?.names?.[0]}</span>
                                    <span class="d-sm-block text-muted text-xs">PID${plant.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-magnifying-glass"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Identification</span>
                                <span class="text-muted text-xs">The plant’s naming and classification details</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-4">
                            <span class="d-block h6 text-heading mb-0">
                                Names <i class="ph ph-info ms-1" data-bs-toggle="tooltip" title="Common names used for the plant"></i>
                            </span>
                            <span class="d-block text-sm text-muted">${plant.identification?.names.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-4">
                            <span class="d-block h6 text-heading mb-0">
                                Scientific name <i class="ph ph-info ms-1" data-bs-toggle="tooltip" title="The official Latin name of the plant"></i>
                            </span>
                            <span class="d-block text-sm text-muted">${plant.identification?.sci_name}</span>
                        </div>
                        <div class="col-6 mb-4">
                            <span class="d-block h6 text-heading mb-0">Family</span>
                            <span class="d-block text-sm text-muted">${plant.identification?.family}</span>
                        </div>
                        <div class="col-6 mb-4">
                            <span class="d-block h6 text-heading mb-0">Cultivar</span>
                            <span class="d-block text-sm text-muted">${plant.identification?.cultivar}</span>
                        </div>
                        <div class="col-6 mb-4">
                            <span class="d-block h6 text-heading mb-0">Synonyms</span>
                            <span class="d-block text-sm text-muted">${plant.identification?.synonyms.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <p>Ideal Temp Range: ${plant.care?.temperature?.optimal_f.join(' - ') || 'N/A'}%
            <div class="d-flex align-items-center gap-2">
                <img src="${thumb = plant.media?.thumbnail || 'https://placehold.co/50'}" class="avatar rounded-1 object-cover" style="height: 25px; width: 15px;">
                ${plant.media?.images?.map(img => `
                    <img src="${img}" class="avatar rounded-1 object-cover" style="height: 25px; width: 15px;">
                `).join('')}
            </div>
        `;
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