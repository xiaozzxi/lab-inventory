// Freezer -80°C Module
// Tower/Shelf layout for -80 freezer

const freezer80Module = {
    filtered: null,
    expandedTowers: {},
    towers: ['A', 'B', 'C', 'D', 'E', 'F'],
    shelves: [1, 2, 3, 4, 5, 6, 7],
    
    init() {
        this.towers.forEach(t => this.expandedTowers[t] = true);
    },
    
    render() {
        return `
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchFreezer80" 
                           placeholder="Search by owner, contents, tower, shelf..."
                           oninput="freezer80Module.handleSearch()">
                    <select id="f80TowerFilter" onchange="freezer80Module.handleSearch()">
                        <option value="">All Towers</option>
                        ${this.towers.map(t => `<option value="${t}">Tower ${t}</option>`).join('')}
                    </select>
                    <select id="f80OwnerFilter" onchange="freezer80Module.handleSearch()">
                        <option value="">All Owners</option>
                    </select>
                    <button class="btn btn-primary" onclick="freezer80Module.showAdd()">+ Add Entry</button>
                    <button class="btn export-btn" onclick="freezer80Module.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item"><span>Total:</span><span class="stat-number" id="f80Total">0</span></div>
                    <div class="stat-item"><span>Showing:</span><span class="stat-number" id="f80Filtered">0</span></div>
                </div>
            </div>
            <div class="freezer-container f80" id="freezer80Container">
                <div class="freezer-title">🥶 -80°C Freezer</div>
                <div class="freezer-grid" id="freezer80Grid"></div>
            </div>
            <style>
                .freezer-container.f80 {
                    max-width: 1100px;
                    margin: 20px auto;
                    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
                    border: 3px solid #0d47a1;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                .freezer-container.f80 .freezer-title {
                    text-align: center;
                    font-size: 1.3em;
                    font-weight: bold;
                    color: white;
                    padding: 10px;
                    background: linear-gradient(135deg, #4527a0 0%, #7b1fa2 100%);
                    border-radius: 8px;
                    margin-bottom: 15px;
                }
                .freezer-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 10px;
                }
                .tower {
                    background: rgba(255,255,255,0.95);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .tower-header {
                    padding: 10px;
                    background: linear-gradient(135deg, #5c6bc0 0%, #3f51b5 100%);
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    cursor: pointer;
                }
                .tower-header:hover { background: linear-gradient(135deg, #7986cb 0%, #5c6bc0 100%); }
                .tower-body { padding: 8px; }
                .tower-body.collapsed { display: none; }
                .shelf-row {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    margin: 4px 0;
                    background: #f5f5f5;
                    border-radius: 4px;
                    font-size: 0.85em;
                    min-height: 36px;
                }
                .shelf-row:hover { background: #e8eaf6; }
                .shelf-num {
                    width: 24px;
                    height: 24px;
                    background: #3f51b5;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75em;
                    font-weight: bold;
                    margin-right: 8px;
                    flex-shrink: 0;
                }
                .shelf-content {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .shelf-content.free { color: #4caf50; font-style: italic; }
                .shelf-content.broken { color: #f44336; font-style: italic; }
                .shelf-actions {
                    display: flex;
                    gap: 2px;
                    opacity: 0.3;
                    transition: opacity 0.15s;
                }
                .shelf-row:hover .shelf-actions { opacity: 1; }
                .shelf-actions button {
                    padding: 2px 5px;
                    font-size: 0.7em;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                }
                @media (max-width: 900px) {
                    .freezer-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 500px) {
                    .freezer-grid { grid-template-columns: repeat(2, 1fr); }
                }
            </style>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchFreezer80').value.toLowerCase();
        const towerFilter = document.getElementById('f80TowerFilter').value;
        const ownerFilter = document.getElementById('f80OwnerFilter').value;
        
        let results = app.data.freezer80 || [];
        
        if (query) {
            results = results.filter(item => 
                item.owner.toLowerCase().includes(query) ||
                item.contents.toLowerCase().includes(query) ||
                item.tower.toLowerCase().includes(query) ||
                (item.notes && item.notes.toLowerCase().includes(query))
            );
        }
        if (towerFilter) results = results.filter(item => item.tower === towerFilter);
        if (ownerFilter) results = results.filter(item => item.owner === ownerFilter);
        
        this.filtered = results;
        this.updateOwnerFilter();
        this.display();
    },
    
    updateOwnerFilter() {
        const filter = document.getElementById('f80OwnerFilter');
        if (!filter) return;
        const data = this.filtered || app.data.freezer80 || [];
        const current = filter.value;
        const owners = [...new Set(data.map(i => i.owner).filter(o => o && o !== 'FREE' && o !== 'Broken'))].sort();
        filter.innerHTML = '<option value="">All Owners</option>' + owners.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('');
    },
    
    display() {
        const allData = app.data.freezer80 || [];
        if (this.filtered === null) this.filtered = [...allData];
        
        document.getElementById('f80Total').textContent = allData.length;
        document.getElementById('f80Filtered').textContent = this.filtered.length;
        
        // Build lookup
        const lookup = {};
        this.filtered.forEach(item => {
            const key = `${item.tower}-${item.shelf}`;
            lookup[key] = item;
        });
        
        let html = '';
        this.towers.forEach(tower => {
            const expanded = this.expandedTowers[tower];
            html += `
                <div class="tower">
                    <div class="tower-header" onclick="freezer80Module.toggleTower('${tower}')">
                        Tower ${tower} ${expanded ? '▼' : '▶'}
                    </div>
                    <div class="tower-body ${expanded ? '' : 'collapsed'}">
            `;
            this.shelves.forEach(shelf => {
                const item = lookup[`${tower}-${shelf}`];
                const owner = item ? item.owner : '';
                const contents = item ? item.contents : '';
                const displayText = owner || '<span class="free">Available</span>';
                const isFree = !owner || owner === 'FREE';
                const isBroken = owner && owner.toLowerCase() === 'broken';
                
                html += `
                    <div class="shelf-row" title="${app.esc(contents)}">
                        <span class="shelf-num">${shelf}</span>
                        <span class="shelf-content ${isFree ? 'free' : ''} ${isBroken ? 'broken' : ''}">${isFree ? '<span class="free">Available</span>' : app.esc(owner)}</span>
                        <span class="shelf-actions">
                            <button onclick="freezer80Module.showEdit('${tower}', ${shelf})" title="Edit">✏️</button>
                        </span>
                    </div>
                `;
            });
            html += `</div></div>`;
        });
        
        document.getElementById('freezer80Grid').innerHTML = html;
        this.updateOwnerFilter();
    },
    
    toggleTower(tower) {
        this.expandedTowers[tower] = !this.expandedTowers[tower];
        this.display();
    },
    
    showAdd() {
        const form = `
            <div class="form-group">
                <label>Tower</label>
                <select id="fTower" required>
                    ${this.towers.map(t => `<option value="${t}">Tower ${t}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Shelf</label>
                <select id="fShelf" required>
                    ${this.shelves.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Owner / Assignee</label>
                <input id="fOwner" placeholder="e.g., Zhong, Julia, FREE">
            </div>
            <div class="form-group">
                <label>Contents</label>
                <input id="fContents" placeholder="e.g., Competent cells, Plasmids">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2"></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="freezer80Module.save()">Save</button>
            </div>
        `;
        app.showModal('Add -80°C Freezer Entry', form);
    },
    
    save() {
        const tower = document.getElementById('fTower').value;
        const shelf = parseInt(document.getElementById('fShelf').value);
        const owner = document.getElementById('fOwner').value.trim();
        const contents = document.getElementById('fContents').value.trim();
        const notes = document.getElementById('fNotes').value.trim();
        
        if (!app.data.freezer80) app.data.freezer80 = [];
        
        const id = `F80-${tower}${shelf}`;
        const idx = app.data.freezer80.findIndex(i => i.tower === tower && i.shelf === shelf);
        
        const entry = { id, tower, shelf, owner, contents, notes };
        
        if (idx >= 0) app.data.freezer80[idx] = entry;
        else app.data.freezer80.push(entry);
        
        app.saveData('freezer80', app.data.freezer80);
        app.closeModal();
        this.filtered = [...app.data.freezer80];
        this.display();
    },
    
    showEdit(tower, shelf) {
        const item = (app.data.freezer80 || []).find(i => i.tower === tower && i.shelf === shelf) || {};
        
        const form = `
            <div class="form-group">
                <label>Location</label>
                <input value="Tower ${tower} - Shelf ${shelf}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Owner / Assignee</label>
                <input id="fOwner" value="${app.esc(item.owner || '')}" placeholder="e.g., Zhong, Julia, FREE">
            </div>
            <div class="form-group">
                <label>Contents</label>
                <input id="fContents" value="${app.esc(item.contents || '')}" placeholder="e.g., Competent cells">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2">${app.esc(item.notes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                ${item.owner ? `<button class="btn btn-danger" onclick="freezer80Module.clear('${tower}', ${shelf})" style="background:#dc3545;">Clear</button>` : ''}
                <button class="btn btn-primary" onclick="freezer80Module.update('${tower}', ${shelf})">Save</button>
            </div>
        `;
        app.showModal(`Edit Tower ${tower} Shelf ${shelf}`, form);
    },
    
    update(tower, shelf) {
        if (!app.data.freezer80) app.data.freezer80 = [];
        
        const id = `F80-${tower}${shelf}`;
        const idx = app.data.freezer80.findIndex(i => i.tower === tower && i.shelf === shelf);
        
        const entry = {
            id,
            tower,
            shelf,
            owner: document.getElementById('fOwner').value.trim(),
            contents: document.getElementById('fContents').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        if (idx >= 0) app.data.freezer80[idx] = entry;
        else app.data.freezer80.push(entry);
        
        app.saveData('freezer80', app.data.freezer80);
        app.closeModal();
        this.filtered = [...app.data.freezer80];
        this.display();
    },
    
    clear(tower, shelf) {
        if (!confirm('Clear this shelf assignment?')) return;
        app.data.freezer80 = (app.data.freezer80 || []).filter(i => !(i.tower === tower && i.shelf === shelf));
        app.saveData('freezer80', app.data.freezer80);
        app.closeModal();
        this.filtered = [...app.data.freezer80];
        this.display();
    },
    
    export() {
        const headers = ['Tower', 'Shelf', 'Owner', 'Contents', 'Notes'];
        const data = (this.filtered || app.data.freezer80 || []).map(i => [i.tower, i.shelf, i.owner, i.contents, i.notes]);
        app.exportCSV('freezer_80', headers, data);
    }
};
