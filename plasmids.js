// Plasmids Module
// Handles all plasmid-related functionality

const plasmidsModule = {
    filtered: [],
    sortField: null,
    sortDir: 'desc',
    sorted: false,
    
    init() {
        // Module initialized
    },
    
    render() {
        const backbones = [...new Set(app.data.plasmids.map(p => p.backbone).filter(b => b))].sort();
        
        return `
            <div class="dropbox-notice">
                📁 <strong>Note:</strong> Detailed sequence files (.dna) available on Dropbox: Wu Lab\\Inventory
            </div>
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchPlasmids" 
                           placeholder="Search plasmids by ID, name, backbone, notes..."
                           oninput="plasmidsModule.handleSearch()">
                    <select id="backboneFilter" onchange="plasmidsModule.handleSearch()">
                        <option value="">All Backbones</option>
                        ${backbones.map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary" onclick="plasmidsModule.showAdd()">+ Add Plasmid</button>
                    <button class="btn export-btn" onclick="plasmidsModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="plasmidTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Showing:</span>
                        <span class="stat-number" id="plasmidFiltered">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="plasmidsModule.sort('id')">ID ↕</th>
                            <th onclick="plasmidsModule.sort('backbone')">Backbone ↕</th>
                            <th onclick="plasmidsModule.sort('name')">Name ↕</th>
                            <th>Notes</th>
                            <th>Storage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="plasmidTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchPlasmids').value;
        const backbone = document.getElementById('backboneFilter') ? document.getElementById('backboneFilter').value : '';
        
        let results = app.data.plasmids;
        
        // Apply search
        if (query) {
            results = app.search(results, query, ['id', 'name', 'backbone', 'notes', 'storageLocation']);
        }
        
        // Apply backbone filter
        if (backbone) {
            results = results.filter(p => p.backbone === backbone);
        }
        
        this.filtered = results;
        this.sorted = false;
        
        this.updateBackboneFilter();
        this.display();
    },
    
    updateBackboneFilter() {
        const backboneSelect = document.getElementById('backboneFilter');
        if (!backboneSelect) return;
        
        const currentValue = backboneSelect.value;
        const availableBackbones = [...new Set(this.filtered.map(p => p.backbone).filter(b => b))].sort();
        
        backboneSelect.innerHTML = '<option value="">All Backbones</option>' +
            availableBackbones.map(b => `<option value="${b}" ${b === currentValue ? 'selected' : ''}>${b}</option>`).join('');
    },
    
    display() {
        if (!this.filtered || this.filtered.length === 0) {
            this.filtered = [...app.data.plasmids];
        }
        
        // Default: newest first (highest ID first)
        if (!this.sorted) {
            this.filtered.sort((a, b) => b.id - a.id);
        }
        
        document.getElementById('plasmidTotal').textContent = app.data.plasmids.length;
        document.getElementById('plasmidFiltered').textContent = this.filtered.length;
        
        const tbody = document.getElementById('plasmidTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">No plasmids found matching your search criteria</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(p => `
            <tr>
                <td class="item-id">HW${String(p.id).padStart(3, '0')}</td>
                <td>${app.esc(p.backbone)}</td>
                <td><strong>${app.esc(p.name)}</strong></td>
                <td class="notes-cell" title="${app.esc(p.notes)}">${app.esc(p.notes)}</td>
                <td>${app.esc(p.storageLocation || '')}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="plasmidsModule.showEdit(${p.id})" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="plasmidsModule.confirmDelete(${p.id})" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    },
    
    showAdd() {
        const nextId = app.getNextId('plasmids');
        
        const form = `
            <div class="form-group">
                <label>ID Number</label>
                <input type="number" id="fId" value="${nextId}" required>
            </div>
            <div class="form-group">
                <label>Backbone</label>
                <input id="fBackbone" placeholder="e.g., pcDNA5FRT">
            </div>
            <div class="form-group">
                <label>Plasmid Name</label>
                <input id="fName" required placeholder="e.g., HA-TRAM2-FL">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" placeholder="Optional notes..."></textarea>
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" placeholder="e.g., Box 1, Slot A5">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="plasmidsModule.save()">Save Plasmid</button>
            </div>
        `;
        
        app.showModal('Add Plasmid', form);
    },
    
    save() {
        const id = parseInt(document.getElementById('fId').value);
        const backbone = document.getElementById('fBackbone').value;
        const name = document.getElementById('fName').value;
        const notes = document.getElementById('fNotes').value;
        const storage = document.getElementById('fStorage').value;
        
        if (!name) {
            alert('Plasmid name is required');
            return;
        }
        
        // Check for duplicate ID
        if (app.data.plasmids.some(p => p.id === id)) {
            alert('A plasmid with this ID already exists');
            return;
        }
        
        const newPlasmid = {
            id: id,
            backbone: backbone,
            name: name,
            notes: notes,
            storageLocation: storage,
            sequenceVerified: false,
            antibioticResistance: '',
            source: '',
            createdBy: '',
            dateCreated: new Date().toISOString().split('T')[0]
        };
        
        app.data.plasmids.push(newPlasmid);
        app.data.plasmids.sort((a, b) => a.id - b.id);
        app.saveData('plasmids', app.data.plasmids);
        app.updateNextId('plasmids', id);
        
        app.closeModal();
        this.filtered = [...app.data.plasmids];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const plasmid = app.data.plasmids.find(p => p.id === id);
        if (!plasmid) return;
        
        const form = `
            <div class="form-group">
                <label>ID Number</label>
                <input type="number" id="fId" value="${plasmid.id}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Backbone</label>
                <input id="fBackbone" value="${app.esc(plasmid.backbone || '')}">
            </div>
            <div class="form-group">
                <label>Plasmid Name</label>
                <input id="fName" value="${app.esc(plasmid.name)}" required>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes">${app.esc(plasmid.notes || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" value="${app.esc(plasmid.storageLocation || '')}">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="plasmidsModule.update(${id})">Update Plasmid</button>
            </div>
        `;
        
        app.showModal('Edit Plasmid', form);
    },
    
    update(id) {
        const index = app.data.plasmids.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value;
        if (!name) {
            alert('Plasmid name is required');
            return;
        }
        
        app.data.plasmids[index] = {
            ...app.data.plasmids[index],
            backbone: document.getElementById('fBackbone').value,
            name: name,
            notes: document.getElementById('fNotes').value,
            storageLocation: document.getElementById('fStorage').value
        };
        
        app.saveData('plasmids', app.data.plasmids);
        
        app.closeModal();
        this.filtered = [...app.data.plasmids];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const plasmid = app.data.plasmids.find(p => p.id === id);
        if (!plasmid) return;
        
        const displayId = `HW${String(plasmid.id).padStart(3, '0')}`;
        
        const content = `
            <p>Are you sure you want to delete this plasmid?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${displayId}</strong> - ${app.esc(plasmid.name)}<br>
                <small style="color:#666;">${plasmid.backbone ? 'Backbone: ' + app.esc(plasmid.backbone) : ''}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="plasmidsModule.delete(${id})" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Plasmid', content);
    },
    
    delete(id) {
        app.data.plasmids = app.data.plasmids.filter(p => p.id !== id);
        app.saveData('plasmids', app.data.plasmids);
        
        app.closeModal();
        this.filtered = [...app.data.plasmids];
        this.sorted = false;
        this.display();
    },
    
    sort(field) {
        if (!this.sortField || this.sortField !== field) {
            this.sortField = field;
            this.sortDir = 'asc';
        } else {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        }
        
        this.filtered.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal || '').toLowerCase();
            }
            
            if (this.sortDir === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.sorted = true;
        this.display();
    },
    
    export() {
        const headers = ['ID', 'Backbone', 'Name', 'Notes', 'Storage'];
        const data = this.filtered.map(p => [
            `HW${String(p.id).padStart(3, '0')}`,
            p.backbone,
            p.name,
            p.notes,
            p.storageLocation || ''
        ]);
        
        app.exportCSV('plasmids', headers, data);
    }
};
