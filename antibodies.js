// Antibodies Module
// Handles all antibody inventory functionality

const antibodiesModule = {
    filtered: null,
    sortField: null,
    sortDir: 'desc',
    sorted: false,
    
    init() {
        // Module initialized
    },
    
    render() {
        return `
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchAntibodies" 
                           placeholder="Search antibodies by target, host, supplier, catalog, RRID..."
                           oninput="antibodiesModule.handleSearch()">
                    <select id="hostFilter" onchange="antibodiesModule.handleSearch()">
                        <option value="">All Hosts</option>
                    </select>
                    <select id="supplierFilter" onchange="antibodiesModule.handleSearch()">
                        <option value="">All Suppliers</option>
                    </select>
                    <button class="btn btn-primary" onclick="antibodiesModule.showAdd()">+ Add Antibody</button>
                    <button class="btn export-btn" onclick="antibodiesModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="antibodyTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Showing:</span>
                        <span class="stat-number" id="antibodyFiltered">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="antibodiesModule.sort('id')">ID ↕</th>
                            <th onclick="antibodiesModule.sort('name')">Target ↕</th>
                            <th onclick="antibodiesModule.sort('supplier')">Vendor ↕</th>
                            <th>Catalog #</th>
                            <th>Host</th>
                            <th>WB Dilution</th>
                            <th>IP</th>
                            <th>Storage</th>
                            <th>RRID</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="antibodyTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchAntibodies').value;
        const host = document.getElementById('hostFilter') ? document.getElementById('hostFilter').value : '';
        const supplier = document.getElementById('supplierFilter') ? document.getElementById('supplierFilter').value : '';
        
        let results = app.data.antibodies;
        
        // Apply search
        if (query) {
            results = app.search(results, query, ['id', 'name', 'host', 'application', 'supplier', 'catalog', 'notes', 'wbDilution', 'ipAmount', 'rrid']);
        }
        
        // Apply filters
        if (host) {
            results = results.filter(a => a.host === host);
        }
        if (supplier) {
            results = results.filter(a => a.supplier === supplier);
        }
        
        this.filtered = results;
        this.sorted = false;
        this.updateFilters();
        this.display();
    },
    
    updateFilters() {
        // Update host filter
        const hostFilter = document.getElementById('hostFilter');
        if (hostFilter) {
            const currentHost = hostFilter.value;
            const hosts = [...new Set(this.filtered.map(a => a.host).filter(h => h))].sort();
            hostFilter.innerHTML = '<option value="">All Hosts</option>' +
                hosts.map(h => `<option value="${h}" ${h === currentHost ? 'selected' : ''}>${h}</option>`).join('');
        }
        
        // Update supplier filter
        const supplierFilter = document.getElementById('supplierFilter');
        if (supplierFilter) {
            const currentSupplier = supplierFilter.value;
            const suppliers = [...new Set(this.filtered.map(a => a.supplier).filter(s => s))].sort();
            supplierFilter.innerHTML = '<option value="">All Suppliers</option>' +
                suppliers.map(s => `<option value="${s}" ${s === currentSupplier ? 'selected' : ''}>${s}</option>`).join('');
        }
    },
    
    display() {
        // Only reset to all data on initial load (when filtered is null/undefined)
        if (this.filtered === null || this.filtered === undefined) {
            this.filtered = [...app.data.antibodies];
        }
        
        // Default: newest first (by ID number)
        if (!this.sorted && this.filtered.length > 0) {
            this.filtered.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''));
                const bNum = parseInt(b.id.replace(/\D/g, ''));
                return bNum - aNum;
            });
        }
        
        document.getElementById('antibodyTotal').textContent = app.data.antibodies.length;
        document.getElementById('antibodyFiltered').textContent = this.filtered.length;
        
        const tbody = document.getElementById('antibodyTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;color:#999;">No antibodies found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(a => `
            <tr>
                <td class="item-id">${app.esc(a.id)}</td>
                <td><strong>${app.esc(a.name)}</strong></td>
                <td>${app.esc(a.supplier)}</td>
                <td>${app.esc(a.catalog)}</td>
                <td>${app.esc(a.host)}</td>
                <td>${app.esc(a.wbDilution)}</td>
                <td>${app.esc(a.ipAmount)}</td>
                <td>${app.esc(a.storage || a.location)}</td>
                <td>${app.esc(a.rrid || '')}</td>
                <td class="notes-cell" title="${app.esc(a.notes)}">${app.esc(a.notes)}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="antibodiesModule.showEdit('${a.id}')" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="antibodiesModule.confirmDelete('${a.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
        
        this.updateFilters();
    },
    
    showAdd() {
        const nextId = app.getNextId('antibodies');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required>
            </div>
            <div class="form-group">
                <label>Target Name</label>
                <input id="fName" required placeholder="e.g., Anti-GFP, EMC1">
            </div>
            <div class="form-group">
                <label>Host Species</label>
                <select id="fHost">
                    <option value="">-- Select --</option>
                    <option>Rabbit</option>
                    <option>Mouse</option>
                    <option>Goat</option>
                    <option>Rat</option>
                    <option>Chicken</option>
                    <option>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Clonality</label>
                <select id="fClonality">
                    <option value="">-- Select --</option>
                    <option>Polyclonal</option>
                    <option>Monoclonal</option>
                </select>
            </div>
            <div class="form-group">
                <label>Vendor/Supplier</label>
                <input id="fSupplier" placeholder="e.g., Abcam, Bethyl">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" placeholder="e.g., ab290">
            </div>
            <div class="form-group">
                <label>Lot Number</label>
                <input id="fLot" placeholder="Optional">
            </div>
            <div class="form-group">
                <label>Western Blot Dilution</label>
                <input id="fWbDilution" placeholder="e.g., 1:1000">
            </div>
            <div class="form-group">
                <label>IP Amount/Dilution</label>
                <input id="fIpAmount" placeholder="e.g., 1:500 or 2uL">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" placeholder="e.g., Freezer A, Box 3">
            </div>
            <div class="form-group">
                <label>RRID</label>
                <input id="fRrid" placeholder="e.g., AB_123456">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3" placeholder="Any additional notes..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="antibodiesModule.save()">Save Antibody</button>
            </div>
        `;
        
        app.showModal('Add Antibody', form);
    },
    
    save() {
        const id = document.getElementById('fId').value.trim();
        const name = document.getElementById('fName').value.trim();
        
        if (!id || !name) {
            alert('ID and Target Name are required');
            return;
        }
        
        // Check for duplicate ID
        if (app.data.antibodies.some(a => a.id === id)) {
            alert('An antibody with this ID already exists');
            return;
        }
        
        // Build application string from WB and IP
        const wbDilution = document.getElementById('fWbDilution').value.trim();
        const ipAmount = document.getElementById('fIpAmount').value.trim();
        const apps = [];
        if (wbDilution) apps.push('WB');
        if (ipAmount) apps.push('IP');
        
        const antibody = {
            id: id,
            name: name,
            host: document.getElementById('fHost').value,
            clonality: document.getElementById('fClonality').value,
            application: apps.join(', '),
            wbDilution: wbDilution,
            ipAmount: ipAmount,
            supplier: document.getElementById('fSupplier').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            lot: document.getElementById('fLot').value.trim(),
            storage: document.getElementById('fStorage').value.trim(),
            location: document.getElementById('fStorage').value.trim(),
            rrid: document.getElementById('fRrid').value.trim(),
            notes: document.getElementById('fNotes').value.trim(),
            dateAdded: new Date().toISOString().split('T')[0]
        };
        
        app.data.antibodies.push(antibody);
        app.saveData('antibodies', app.data.antibodies);
        app.updateNextId('antibodies', id);
        
        app.closeModal();
        this.filtered = [...app.data.antibodies];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const antibody = app.data.antibodies.find(a => a.id === id);
        if (!antibody) return;
        
        const hostOptions = ['', 'Rabbit', 'Mouse', 'Goat', 'Rat', 'Chicken', 'Other']
            .map(h => `<option value="${h}" ${antibody.host === h ? 'selected' : ''}>${h || '-- Select --'}</option>`)
            .join('');
        
        const clonalityOptions = ['', 'Polyclonal', 'Monoclonal']
            .map(c => `<option value="${c}" ${antibody.clonality === c ? 'selected' : ''}>${c || '-- Select --'}</option>`)
            .join('');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(antibody.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Target Name</label>
                <input id="fName" value="${app.esc(antibody.name)}" required>
            </div>
            <div class="form-group">
                <label>Host Species</label>
                <select id="fHost">${hostOptions}</select>
            </div>
            <div class="form-group">
                <label>Clonality</label>
                <select id="fClonality">${clonalityOptions}</select>
            </div>
            <div class="form-group">
                <label>Vendor/Supplier</label>
                <input id="fSupplier" value="${app.esc(antibody.supplier)}">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" value="${app.esc(antibody.catalog)}">
            </div>
            <div class="form-group">
                <label>Lot Number</label>
                <input id="fLot" value="${app.esc(antibody.lot || '')}">
            </div>
            <div class="form-group">
                <label>Western Blot Dilution</label>
                <input id="fWbDilution" value="${app.esc(antibody.wbDilution)}">
            </div>
            <div class="form-group">
                <label>IP Amount/Dilution</label>
                <input id="fIpAmount" value="${app.esc(antibody.ipAmount)}">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" value="${app.esc(antibody.storage || antibody.location || '')}">
            </div>
            <div class="form-group">
                <label>RRID</label>
                <input id="fRrid" value="${app.esc(antibody.rrid || '')}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3">${app.esc(antibody.notes)}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="antibodiesModule.update('${antibody.id}')">Update Antibody</button>
            </div>
        `;
        
        app.showModal('Edit Antibody', form);
    },
    
    update(id) {
        const index = app.data.antibodies.findIndex(a => a.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        if (!name) {
            alert('Target Name is required');
            return;
        }
        
        // Build application string from WB and IP
        const wbDilution = document.getElementById('fWbDilution').value.trim();
        const ipAmount = document.getElementById('fIpAmount').value.trim();
        const apps = [];
        if (wbDilution) apps.push('WB');
        if (ipAmount) apps.push('IP');
        
        const storageVal = document.getElementById('fStorage').value.trim();
        
        app.data.antibodies[index] = {
            ...app.data.antibodies[index],
            name: name,
            host: document.getElementById('fHost').value,
            clonality: document.getElementById('fClonality').value,
            application: apps.join(', '),
            wbDilution: wbDilution,
            ipAmount: ipAmount,
            supplier: document.getElementById('fSupplier').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            lot: document.getElementById('fLot').value.trim(),
            storage: storageVal,
            location: storageVal,
            rrid: document.getElementById('fRrid').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        app.saveData('antibodies', app.data.antibodies);
        
        app.closeModal();
        this.filtered = [...app.data.antibodies];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const antibody = app.data.antibodies.find(a => a.id === id);
        if (!antibody) return;
        
        const content = `
            <p>Are you sure you want to delete this antibody?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(antibody.id)}</strong> - ${app.esc(antibody.name)}<br>
                <small style="color:#666;">${app.esc(antibody.supplier)} ${antibody.catalog ? '(' + app.esc(antibody.catalog) + ')' : ''}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="antibodiesModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Antibody', content);
    },
    
    delete(id) {
        app.data.antibodies = app.data.antibodies.filter(a => a.id !== id);
        app.saveData('antibodies', app.data.antibodies);
        
        app.closeModal();
        this.filtered = [...app.data.antibodies];
        this.sorted = false;
        this.display();
    },
    
    sort(field) {
        if (this.sortField === field) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDir = 'asc';
        }
        
        this.filtered = app.sortData(this.filtered, field, this.sortDir);
        this.sorted = true;
        this.display();
    },
    
    export() {
        const headers = ['ID', 'Target', 'Vendor', 'Catalog #', 'Host', 'WB Dilution', 'IP Amount', 'Storage', 'RRID', 'Notes', 'Date Added'];
        const data = this.filtered.map(a => [
            a.id,
            a.name,
            a.supplier,
            a.catalog,
            a.host,
            a.wbDilution,
            a.ipAmount,
            a.storage || a.location,
            a.rrid || '',
            a.notes,
            a.dateAdded
        ]);
        
        app.exportCSV('antibodies', headers, data);
    }
};
