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
    const body = document.getElementById('inspect');
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
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Names <i class="ph ph-info ms-1" title="Common names used for the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.names.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Scientific Name <i class="ph ph-info ms-1" title="The official Latin name of the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.sci_name}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Family <i class="ph ph-info ms-1" title="Botanical family the plant belongs to"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.family}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Cultivar <i class="ph ph-info ms-1" title="Specific cultivated variety of the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.cultivar}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Genus <i class="ph ph-info ms-1" title="Genus classification of the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.genus}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Synonyms <i class="ph ph-info ms-1" title="Alternate scientific names for the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.identification?.synonyms.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-cube"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Classification</span>
                                <span class="text-muted text-xs">The plant’s naming and classification details</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Category <i class="ph ph-info ms-1" title="Broad plant type classification"></i></span>
                            <span class="d-block text-sm text-muted">${plant.classification?.category}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Growth Habit <i class="ph ph-info ms-1" title="Typical growth pattern or shape"></i></span>
                            <span class="d-block text-sm text-muted">${plant.classification?.growth_habit}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Lifecycle Type <i class="ph ph-info ms-1" title="Duration and nature of life cycle"></i></span>
                            <span class="d-block text-sm text-muted">${plant.classification?.lifecycle_type}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Placement <i class="ph ph-info ms-1" title="Suitable growing environment"></i></span>
                            <span class="d-block text-sm text-muted">${plant.classification?.placement}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Evergreen <i class="ph ph-info ms-1" title="Whether the plant retains leaves year-round"></i></span>
                            <span class="d-block text-sm text-muted">${plant.classification?.evergreen}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-ruler"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Growth</span>
                                <span class="text-muted text-xs">Physical characteristics and growth patterns</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Height (in) <i class="ph ph-info ms-1" title="Typical height range in inches"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.height_in.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Width (in) <i class="ph ph-info ms-1" title="Typical width range in inches"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.width_in.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Growth Rate <i class="ph ph-info ms-1" title="Speed of plant growth"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.growth_rate}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Lifespan (yrs) <i class="ph ph-info ms-1" title="Expected lifespan in years"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.lifespan_yrs.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Root Depth (cm) <i class="ph ph-info ms-1" title="Typical root depth in centimeters"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.root_depth_cm}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Phenology <i class="ph ph-info ms-1" title="Seasonal growth patterns"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.phenology}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Bloom Time <i class="ph ph-info ms-1" title="When the plant typically blooms"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.bloom_time}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Fruit Yield <i class="ph ph-info ms-1" title="Fruit production capacity"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.fruit_yield}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Leaf Color Changes <i class="ph ph-info ms-1" title="Whether leaves change color seasonally"></i></span>
                            <span class="d-block text-sm text-muted">${plant.growth?.leaf_color_changes}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-drop"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Care</span>
                                <span class="text-muted text-xs">Optimal conditions for plant health</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Light Level <i class="ph ph-info ms-1" title="Preferred light conditions"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.light?.level}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Light (lux) <i class="ph ph-info ms-1" title="Light intensity range in lux"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.light?.lux_range.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Sun Tolerance <i class="ph ph-info ms-1" title="Ability to tolerate direct sunlight"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.light?.sun_tolerance}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Temperature (°F) <i class="ph ph-info ms-1" title="Acceptable temperature range in Fahrenheit"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.temperature?.min_f} - ${plant.care?.temperature?.max_f}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Ideal Temp Range (°F) <i class="ph ph-info ms-1" title="Ideal temperature range in Fahrenheit"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.temperature?.optimal_f.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Humidity (%) <i class="ph ph-info ms-1" title="Acceptable humidity range in percentage"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.humidity?.min_percent} - ${plant.care?.humidity?.max_percent}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Misting <i class="ph ph-info ms-1" title="Need for misting to maintain humidity"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.humidity?.misting}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Watering Frequency (days) <i class="ph ph-info ms-1" title="Days between watering"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.watering?.frequency_range_days.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Water Amount (ml/L pot) <i class="ph ph-info ms-1" title="Water volume per liter of pot size"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.watering?.amount_ml_per_liter_pot_volume}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Moisture Preference <i class="ph ph-info ms-1" title="Preferred soil moisture level"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.watering?.moisture_preference}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Watering Method <i class="ph ph-info ms-1" title="Recommended watering technique"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.watering?.method}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Soil Type <i class="ph ph-info ms-1" title="Preferred soil composition"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.soil?.type}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Soil pH <i class="ph ph-info ms-1" title="Acceptable soil pH range"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.soil?.pH_min} - ${plant.care?.soil?.pH_max}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Soil Components <i class="ph ph-info ms-1" title="Key materials in soil mix"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.soil?.components.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Drainage Rate <i class="ph ph-info ms-1" title="Speed of water drainage in soil"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.soil?.drainage_rate}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Fertilizer Type <i class="ph ph-info ms-1" title="Recommended fertilizer composition"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.fertilizer?.type}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Fertilizer Frequency <i class="ph ph-info ms-1" title="How often to fertilize"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.fertilizer?.frequency}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pruning Frequency <i class="ph ph-info ms-1" title="How often to prune"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.pruning?.frequency}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pruning Method <i class="ph ph-info ms-1" title="Recommended pruning technique"></i></span>
                            <span class="d-block text-sm text-muted">${plant.care?.pruning?.method}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-seedling"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Propagation</span>
                                <span class="text-muted text-xs">Methods to reproduce the plant</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Methods <i class="ph ph-info ms-1" title="Techniques for plant propagation"></i></span>
                            <span class="d-block text-sm text-muted">${plant.propagation?.methods.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Success Rate <i class="ph ph-info ms-1" title="Likelihood of propagation success"></i></span>
                            <span class="d-block text-sm text-muted">${plant.propagation?.success_rate}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Season <i class="ph ph-info ms-1" title="Best time for propagation"></i></span>
                            <span class="d-block text-sm text-muted">${plant.propagation?.season}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Germination (days) <i class="ph ph-info ms-1" title="Time for seeds to sprout"></i></span>
                            <span class="d-block text-sm text-muted">${plant.propagation?.germination_days}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-globe"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Ecology</span>
                                <span class="text-muted text-xs">Environmental interactions</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Native Region <i class="ph ph-info ms-1" title="Geographic origin of the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.native_region}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Invasive Status <i class="ph ph-info ms-1" title="Potential to spread aggressively"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.invasive_status}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pollinators <i class="ph ph-info ms-1" title="Species that pollinate the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.pollinators.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Biodiversity Index <i class="ph ph-info ms-1" title="Impact on local biodiversity"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.biodiversity_index}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Soil Stabilization <i class="ph ph-info ms-1" title="Ability to prevent soil erosion"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.soil_stabilization}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Urban Tolerance <i class="ph ph-info ms-1" title="Adaptability to urban environments"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ecology?.urban_tolerance}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-flask"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Science</span>
                                <span class="text-muted text-xs">Biological and chemical properties</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Photosynthetic Rate <i class="ph ph-info ms-1" title="Rate of photosynthesis in µmol/m²/s"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.photosynthetic_rate?.estimate} (${plant.science?.photosynthetic_rate?.range?.[0]}–${plant.science?.photosynthetic_rate?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Water Use Efficiency (g/L) <i class="ph ph-info ms-1" title="Grams of biomass per liter of water"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.water_use_efficiency_g_l?.estimate} (${plant.science?.water_use_efficiency_g_l?.range?.[0]}–${plant.science?.water_use_efficiency_g_l?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Leaf Surface Area (cm²) <i class="ph ph-info ms-1" title="Total leaf surface area"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.leaf_surface_area_cm2?.estimate} (${plant.science?.leaf_surface_area_cm2?.range?.[0]}–${plant.science?.leaf_surface_area_cm2?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">CO2 Reduction (ppm) <i class="ph ph-info ms-1" title="CO2 reduction in parts per million"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.co2_reduction_ppm?.estimate} (${plant.science?.co2_reduction_ppm?.range?.[0]}–${plant.science?.co2_reduction_ppm?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Carbon Sequestration (g/yr) <i class="ph ph-info ms-1" title="Carbon stored per year in grams"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.carbon_sequestration_g_per_year?.estimate} (${plant.science?.carbon_sequestration_g_per_year?.range?.[0]}–${plant.science?.carbon_sequestration_g_per_year?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Soil Biome Impact <i class="ph ph-info ms-1" title="Effect on soil microbial communities"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.soil_biome_impact}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">UV Protection <i class="ph ph-info ms-1" title="Plant's UV resistance mechanism"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.uv_protection}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Genetic Diversity <i class="ph ph-info ms-1" title="Measure of genetic variation"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.genetic_diversity?.estimate} (${plant.science?.genetic_diversity?.range?.[0]}–${plant.science?.genetic_diversity?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Oxygen Production (mg/hr) <i class="ph ph-info ms-1" title="Oxygen produced per hour"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.oxygen_production_mg_per_hr?.estimate} (${plant.science?.oxygen_production_mg_per_hr?.range?.[0]}–${plant.science?.oxygen_production_mg_per_hr?.range?.[1]})</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Leaf Thickness (mm) <i class="ph ph-info ms-1" title="Average leaf thickness"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.leaf_thickness_mm?.estimate} (${plant.science?.leaf_thickness_mm?.range?.[0]}–${plant.science?.leaf_thickness_mm?.range?.[1]})</span>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Nitrogen Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of nitrogen absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.nitrogen?.estimate} (${plant.science?.nutrient_uptake?.nitrogen?.range?.[0]}–${plant.science?.nutrient_uptake?.nitrogen?.range?.[1]}) – ${plant.science?.nutrient_uptake?.nitrogen?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Phosphorus Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of phosphorus absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.phosphorus?.estimate} (${plant.science?.nutrient_uptake?.phosphorus?.range?.[0]}–${plant.science?.nutrient_uptake?.phosphorus?.range?.[1]}) – ${plant.science?.nutrient_uptake?.phosphorus?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Potassium Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of potassium absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.potassium?.estimate} (${plant.science?.nutrient_uptake?.potassium?.range?.[0]}–${plant.science?.nutrient_uptake?.potassium?.range?.[1]}) – ${plant.science?.nutrient_uptake?.potassium?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Calcium Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of calcium absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.calcium?.estimate} (${plant.science?.nutrient_uptake?.calcium?.range?.[0]}–${plant.science?.nutrient_uptake?.calcium?.range?.[1]}) – ${plant.science?.nutrient_uptake?.calcium?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Magnesium Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of magnesium absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.magnesium?.estimate} (${plant.science?.nutrient_uptake?.magnesium?.range?.[0]}–${plant.science?.nutrient_uptake?.magnesium?.range?.[1]}) – ${plant.science?.nutrient_uptake?.magnesium?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Iron Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of iron absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.iron?.estimate} (${plant.science?.nutrient_uptake?.iron?.range?.[0]}–${plant.science?.nutrient_uptake?.iron?.range?.[1]}) – ${plant.science?.nutrient_uptake?.iron?.role}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Zinc Uptake (mg/kg) <i class="ph ph-info ms-1" title="Amount and role of zinc absorbed"></i></span>
                            <span class="d-block text-sm text-muted">${plant.science?.nutrient_uptake?.zinc?.estimate} (${plant.science?.nutrient_uptake?.zinc?.range?.[0]}–${plant.science?.nutrient_uptake?.zinc?.range?.[1]}) – ${plant.science?.nutrient_uptake?.zinc?.role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-leaf"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Benefits</span>
                                <span class="text-muted text-xs">Advantages for environment and humans</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Air Quality <i class="ph ph-info ms-1" title="Pollutants the plant can remove"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.air_quality.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Ecological Benefits <i class="ph ph-info ms-1" title="Environmental advantages"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.ecological.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Mental Health <i class="ph ph-info ms-1" title="Psychological benefits"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.mental_health.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Cultural Significance <i class="ph ph-info ms-1" title="Cultural or symbolic meaning"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.cultural.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Medicinal Value <i class="ph ph-info ms-1" title="Medicinal uses, if any"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.medicinal}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Economic Value <i class="ph ph-info ms-1" title="Commercial or ornamental value"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.economic_value}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Feng Shui <i class="ph ph-info ms-1" title="Feng Shui benefits"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.feng_shui}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pet Safe <i class="ph ph-info ms-1" title="Safety for pets"></i></span>
                            <span class="d-block text-sm text-muted">${plant.benefits?.pet_safe_certified ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-heartbeat"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Health</span>
                                <span class="text-muted text-xs">Potential risks and resilience</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Toxicity <i class="ph ph-info ms-1" title="Toxicity level to humans or pets"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.toxicity}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pests <i class="ph ph-info ms-1" title="Common pests affecting the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.pests.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Diseases <i class="ph ph-info ms-1" title="Common diseases affecting the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.diseases.join(', ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Allergen Potential <i class="ph ph-info ms-1" title="Likelihood of causing allergies"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.allergen_potential}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Climate Resilience <i class="ph ph-info ms-1" title="Ability to withstand climate challenges"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.climate_resilience}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Disease Resistance <i class="ph ph-info ms-1" title="Resistance to common diseases"></i></span>
                            <span class="d-block text-sm text-muted">${plant.health?.disease_resistance_level}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-coin"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Ownership</span>
                                <span class="text-muted text-xs">Cost and suitability</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Average Cost (USD) <i class="ph ph-info ms-1" title="Typical purchase price"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ownership?.cost_usd_avg}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Cost Range (USD) <i class="ph ph-info ms-1" title="Price range for purchase"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ownership?.cost_usd_range.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Availability <i class="ph ph-info ms-1" title="Ease of finding the plant"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ownership?.availability}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Child-Friendly <i class="ph ph-info ms-1" title="Safety for children"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ownership?.child_friendly ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Smell Profile <i class="ph ph-info ms-1" title="Plant's scent characteristics"></i></span>
                            <span class="d-block text-sm text-muted">${plant.ownership?.smell_profile}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-wrench"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Maintenance</span>
                                <span class="text-muted text-xs">Care requirements</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Maintenance Level <i class="ph ph-info ms-1" title="Level of care required"></i></span>
                            <span class="d-block text-sm text-muted">${plant.maintenance?.maintenance_level}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Pot Size (in) <i class="ph ph-info ms-1" title="Recommended pot size range"></i></span>
                            <span class="d-block text-sm text-muted">${plant.maintenance?.pot_size_in.join(' - ')}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Repotting Frequency (yrs) <i class="ph ph-info ms-1" title="How often to repot"></i></span>
                            <span class="d-block text-sm text-muted">${plant.maintenance?.repot_frequency_yrs}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Care Tips <i class="ph ph-info ms-1" title="Additional care recommendations"></i></span>
                            <span class="d-block text-sm text-muted">${plant.maintenance?.care_tips.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-books"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Historical</span>
                                <span class="text-muted text-xs">Cultural and historical context</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Cultivation Origin <i class="ph ph-info ms-1" title="Where cultivation began"></i></span>
                            <span class="d-block text-sm text-muted">${plant.historical?.cultivation_origin}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Ethnobotanical Use <i class="ph ph-info ms-1" title="Traditional cultural uses"></i></span>
                            <span class="d-block text-sm text-muted">${plant.historical?.ethnobotanical}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">First Documented <i class="ph ph-info ms-1" title="Year of first recorded use"></i></span>
                            <span class="d-block text-sm text-muted">${plant.historical?.first_documented}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="d-block h6 text-heading mb-0">Traditional Medicine <i class="ph ph-info ms-1" title="Historical medicinal uses"></i></span>
                            <span class="d-block text-sm text-muted">${plant.historical?.traditional_medicine.join(', ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-5">
                <div class="card-body">
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon icon-shape rounded flex-none text-sm text-bg-light"><i class="ph ph-images-square"></i></div>
                            <div>
                                <span class="d-block text-heading text-sm fw-semibold">Media</span>
                                <span class="text-muted text-xs">Images of the plant</span>
                            </div>
                        </div>
                    </div>
                    <hr class="my-4">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${plant.media?.thumbnail}" class="avatar object-cover" style="height: 100px; width: 70px;">
                        ${plant.media?.images?.map(img => `
                            <img src="${img}" class="avatar object-cover" style="height: 100px; width: 70px;">
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    })() : '<p>No plant selected. Please select a plant from the Database tab.</p><button class="btn btn-sm btn-primary mt-5" id="go-to-database">Go to Database</button>';
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