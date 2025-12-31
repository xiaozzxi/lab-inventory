// Freezer -20°C Module  
// Grid (A-G x 1-6) + Drawers layout

const freezer20Module = {
    filtered: null,
    showGrid: true,
    showDrawers: true,
    columns: ['A', 'B', 'C', 'D', 'E'],
    rows: [1, 2, 3, 4, 5, 6],
    drawers: ['2', '3', '4', '5', '6A', '6B', '7A', '7B'],
    
    init() {},
    
    render() {
        return `
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchFreezer20" 
                           placeholder="Search by owner, contents, position..."
                           oninput="freezer20Module.handleSearch()">
                    <select id="f20TypeFilter" onchange="freezer20Module.handleSearch()">
                        <option value="">All Locations</option>
                        <option value="grid">Grid Positions</option>
                        <option value="drawer">Drawers</option>
                        <option value="unracked">Unracked</option>
                    </select>
                    <select id="f20OwnerFilter" onchange="freezer20Module.handleSearch()">
                        <option value="">All Owners</option>
                    </select>
                    <button class="btn btn-primary" onclick="freezer20Module.showAdd()">+ Add Entry</button>
                    <button class="btn export-btn" onclick="freezer20Module.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item"><span>Total:</span><span class="stat-number" id="f20Total">0</span></div>
                    <div class="stat-item"><span>Showing:</span><span class="stat-number" id="f20Filtered">0</span></div>
                </div>
            </div>
            <div class="freezer-container f20">
                <div class="freezer-title">❄️ -20°C Freezer (Liebherr)</div>
                <div class="f20-layout">
                    <div class="f20-section">
                        <h3>Grid Positions (A-E × 1-6)</h3>
                        <div class="f20-grid" id="f20Grid"></div>
                        <div class="f20-unracked" id="f20Unracked"></div>
                    </div>
                    <div class="f20-section">
                        <h3>Drawers</h3>
                        <div class="f20-drawers" id="f20Drawers"></div>
                    </div>
                </div>
            </div>
            <style>
                .freezer-container.f20 {
                    max-width: 1100px;
                    margin: 20px auto;
                    background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
                    border: 3px solid #00796b;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                .freezer-container.f20 .freezer-title {
                    text-align: center;
                    font-size: 1.3em;
                    font-weight: bold;
                    color: white;
                    padding: 10px;
                    background: linear-gradient(135deg, #00897b 0%, #26a69a 100%);
                    border-radius: 8px;
                    margin-bottom: 15px;
                }
                .f20-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .f20-section {
                    background: rgba(255,255,255,0.95);
                    border-radius: 8px;
                    padding: 15px;
                }
                .f20-section h3 {
                    margin: 0 0 10px 0;
                    color: #00695c;
                    font-size: 1em;
                    border-bottom: 2px solid #00695c;
                    padding-bottom: 5px;
                }
                .f20-grid {
                    display: grid;
                    grid-template-columns: 30px repeat(5, 1fr);
                    gap: 4px;
                    font-size: 0.8em;
                }
                .f20-grid-header {
                    background: #00695c;
                    color: white;
                    padding: 6px;
                    text-align: center;
                    font-weight: bold;
                    border-radius: 4px;
                }
                .f20-grid-row-header {
                    background: #00695c;
                    color: white;
                    padding: 6px;
                    text-align: center;
                    font-weight: bold;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .f20-cell {
                    background: #e0f2f1;
                    padding: 6px;
                    border-radius: 4px;
                    min-height: 40px;
                    cursor: pointer;
                    transition: all 0.15s;
                    font-size: 0.85em;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .f20-cell:hover { background: #b2dfdb; }
                .f20-cell.empty { background: #c8e6c9; color: #2e7d32; font-style: italic; }
                .f20-cell .cell-owner { font-weight: 600; }
                .f20-cell .cell-contents { font-size: 0.8em; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .f20-unracked {
                    margin-top: 10px;
                    padding: 10px;
                    background: #fff3e0;
                    border-radius: 4px;
                    border-left: 3px solid #ff9800;
                }
                .f20-unracked-title { font-weight: 600; color: #e65100; margin-bottom: 5px; }
                .f20-drawers { display: flex; flex-direction: column; gap: 6px; }
                .f20-drawer {
                    background: #e8eaf6;
                    padding: 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .f20-drawer:hover { background: #c5cae9; }
                .f20-drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .f20-drawer-num {
                    background: #3f51b5;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 0.85em;
                }
                .f20-drawer-owner { font-weight: 600; }
                .f20-drawer-contents { font-size: 0.85em; color: #666; margin-top: 5px; }
                @media (max-width: 800px) {
                    .f20-layout { grid-template-columns: 1fr; }
                }
            </style>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchFreezer20').value.toLowerCase();
        const typeFilter = document.getElementById('f20TypeFilter').value;
        const ownerFilter = document.getElementById('f20OwnerFilter').value;
        
        let results = app.data.freezer20 || [];
        
        if (query) {
            results = results.filter(item => 
                (item.owner && item.owner.toLowerCase().includes(query)) ||
                (item.contents && item.contents.toLowerCase().includes(query)) ||
                (item.position && item.position.toLowerCase().includes(query))
            );
        }
        if (typeFilter) results = results.filter(item => item.type === typeFilter);
        if (ownerFilter) results = results.filter(item => item.owner === ownerFilter);
        
        this.filtered = results;
        this.updateOwnerFilter();
        this.display();
    },
    
    updateOwnerFilter() {
        const filter = document.getElementById('f20OwnerFilter');
        if (!filter) return;
        const data = this.filtered || app.data.freezer20 || [];
        const current = filter.value;
        const owners = [...new Set(data.map(i => i.owner).filter(o => o))].sort();
        filter.innerHTML = '<option value="">All Owners</option>' + owners.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('');
    },
    
    display() {
        const allData = app.data.freezer20 || [];
        if (this.filtered === null) this.filtered = [...allData];
        
        document.getElementById('f20Total').textContent = allData.length;
        document.getElementById('f20Filtered').textContent = this.filtered.length;
        
        // Build lookups
        const gridLookup = {};
        const drawerLookup = {};
        const unracked = [];
        
        this.filtered.forEach(item => {
            if (item.type === 'grid') gridLookup[item.position] = item;
            else if (item.type === 'drawer') drawerLookup[item.position] = item;
            else if (item.type === 'unracked') unracked.push(item);
        });
        
        // Render grid
        let gridHtml = '<div class="f20-grid-header"></div>';
        this.columns.forEach(c => { gridHtml += `<div class="f20-grid-header">${c}</div>`; });
        
        this.rows.forEach(r => {
            gridHtml += `<div class="f20-grid-row-header">${r}</div>`;
            this.columns.forEach(c => {
                const pos = `${c}${r}`;
                const item = gridLookup[pos];
                const isEmpty = !item || !item.owner;
                gridHtml += `
                    <div class="f20-cell ${isEmpty ? 'empty' : ''}" onclick="freezer20Module.showEdit('grid', '${pos}')" title="${item ? app.esc(item.contents || '') : 'Available'}">
                        <span class="cell-owner">${item && item.owner ? app.esc(item.owner) : '—'}</span>
                        ${item && item.contents ? `<span class="cell-contents">${app.esc(item.contents)}</span>` : ''}
                    </div>
                `;
            });
        });
        document.getElementById('f20Grid').innerHTML = gridHtml;
        
        // Render unracked
        let unrackedHtml = '<div class="f20-unracked-title">Unracked Areas</div>';
        ['A unracked', 'E unracked'].forEach(area => {
            const items = unracked.filter(i => i.position === area);
            const owners = items.map(i => i.owner).join(', ') || 'Empty';
            unrackedHtml += `<div style="cursor:pointer;padding:4px 0;" onclick="freezer20Module.showEdit('unracked', '${area}')">${area}: ${owners}</div>`;
        });
        document.getElementById('f20Unracked').innerHTML = unrackedHtml;
        
        // Render drawers
        let drawerHtml = '';
        this.drawers.forEach(d => {
            const item = drawerLookup[`Drawer ${d}`] || drawerLookup[d];
            drawerHtml += `
                <div class="f20-drawer" onclick="freezer20Module.showEdit('drawer', 'Drawer ${d}')">
                    <div class="f20-drawer-header">
                        <span class="f20-drawer-num">Drawer ${d}</span>
                        <span class="f20-drawer-owner">${item && item.owner ? app.esc(item.owner) : ''}</span>
                    </div>
                    ${item && item.contents ? `<div class="f20-drawer-contents">${app.esc(item.contents)}</div>` : ''}
                </div>
            `;
        });
        document.getElementById('f20Drawers').innerHTML = drawerHtml;
        
        this.updateOwnerFilter();
    },
    
    showAdd() {
        const form = `
            <div class="form-group">
                <label>Location Type</label>
                <select id="fType" onchange="freezer20Module.updatePositionOptions()">
                    <option value="grid">Grid Position</option>
                    <option value="drawer">Drawer</option>
                    <option value="unracked">Unracked Area</option>
                </select>
            </div>
            <div class="form-group">
                <label>Position</label>
                <select id="fPosition"></select>
            </div>
            <div class="form-group">
                <label>Owner</label>
                <input id="fOwner" placeholder="e.g., Zhong, Julia">
            </div>
            <div class="form-group">
                <label>Contents</label>
                <textarea id="fContents" rows="2" placeholder="e.g., Plasmids, PCR products"></textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2"></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="freezer20Module.save()">Save</button>
            </div>
        `;
        app.showModal('Add -20°C Freezer Entry', form);
        setTimeout(() => this.updatePositionOptions(), 0);
    },
    
    updatePositionOptions() {
        const type = document.getElementById('fType').value;
        const posSelect = document.getElementById('fPosition');
        let options = [];
        
        if (type === 'grid') {
            this.columns.forEach(c => this.rows.forEach(r => options.push(`${c}${r}`)));
        } else if (type === 'drawer') {
            options = this.drawers.map(d => `Drawer ${d}`);
        } else {
            options = ['A unracked', 'E unracked'];
        }
        
        posSelect.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
    },
    
    save() {
        const type = document.getElementById('fType').value;
        const position = document.getElementById('fPosition').value;
        const owner = document.getElementById('fOwner').value.trim();
        const contents = document.getElementById('fContents').value.trim();
        const notes = document.getElementById('fNotes').value.trim();
        
        if (!app.data.freezer20) app.data.freezer20 = [];
        
        const id = `F20-${position.replace(/\s+/g, '')}`;
        const idx = app.data.freezer20.findIndex(i => i.type === type && i.position === position);
        
        const entry = { id, type, position, owner, contents, notes };
        
        if (idx >= 0) app.data.freezer20[idx] = entry;
        else app.data.freezer20.push(entry);
        
        app.saveData('freezer20', app.data.freezer20);
        app.closeModal();
        this.filtered = [...app.data.freezer20];
        this.display();
    },
    
    showEdit(type, position) {
        const item = (app.data.freezer20 || []).find(i => i.type === type && i.position === position) || {};
        
        const form = `
            <div class="form-group">
                <label>Location</label>
                <input value="${position}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Owner</label>
                <input id="fOwner" value="${app.esc(item.owner || '')}" placeholder="e.g., Zhong, Julia">
            </div>
            <div class="form-group">
                <label>Contents</label>
                <textarea id="fContents" rows="3">${app.esc(item.contents || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2">${app.esc(item.notes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                ${item.owner ? `<button class="btn btn-danger" onclick="freezer20Module.clear('${type}', '${position}')" style="background:#dc3545;">Clear</button>` : ''}
                <button class="btn btn-primary" onclick="freezer20Module.update('${type}', '${position}')">Save</button>
            </div>
        `;
        app.showModal(`Edit ${position}`, form);
    },
    
    update(type, position) {
        if (!app.data.freezer20) app.data.freezer20 = [];
        
        const id = `F20-${position.replace(/\s+/g, '')}`;
        const idx = app.data.freezer20.findIndex(i => i.type === type && i.position === position);
        
        const entry = {
            id,
            type,
            position,
            owner: document.getElementById('fOwner').value.trim(),
            contents: document.getElementById('fContents').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        if (idx >= 0) app.data.freezer20[idx] = entry;
        else app.data.freezer20.push(entry);
        
        app.saveData('freezer20', app.data.freezer20);
        app.closeModal();
        this.filtered = [...app.data.freezer20];
        this.display();
    },
    
    clear(type, position) {
        if (!confirm('Clear this location?')) return;
        app.data.freezer20 = (app.data.freezer20 || []).filter(i => !(i.type === type && i.position === position));
        app.saveData('freezer20', app.data.freezer20);
        app.closeModal();
        this.filtered = [...app.data.freezer20];
        this.display();
    },
    
    export() {
        const headers = ['Type', 'Position', 'Owner', 'Contents', 'Notes'];
        const data = (this.filtered || app.data.freezer20 || []).map(i => [i.type, i.position, i.owner, i.contents, i.notes]);
        app.exportCSV('freezer_20', headers, data);
    }
};
