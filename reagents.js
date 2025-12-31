// Reagents Module
// Handles all reagent inventory functionality

const reagentsModule = {
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
                    <input type="text" class="search-input" id="searchReagents" 
                           placeholder="Search reagents by name, vendor, catalog, storage, notes..."
                           oninput="reagentsModule.handleSearch()">
                    <select id="vendorFilter" onchange="reagentsModule.handleSearch()">
                        <option value="">All Vendors</option>
                    </select>
                    <select id="storageFilter" onchange="reagentsModule.handleSearch()">
                        <option value="">All Storage</option>
                    </select>
                    <button class="btn btn-primary" onclick="reagentsModule.showAdd()">+ Add Reagent</button>
                    <button class="btn export-btn" onclick="reagentsModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="reagentTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Showing:</span>
                        <span class="stat-number" id="reagentFiltered">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="reagentsModule.sort('id')">ID ↕</th>
                            <th onclick="reagentsModule.sort('name')">Name ↕</th>
                            <th onclick="reagentsModule.sort('vendor')">Vendor ↕</th>
                            <th>Catalog #</th>
                            <th onclick="reagentsModule.sort('storage')">Storage ↕</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reagentTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchReagents').value;
        const vendor = document.getElementById('vendorFilter') ? document.getElementById('vendorFilter').value : '';
        const storage = document.getElementById('storageFilter') ? document.getElementById('storageFilter').value : '';
        
        let results = app.data.reagents;
        
        // Apply search
        if (query) {
            results = app.search(results, query, ['id', 'name', 'vendor', 'catalog', 'storage', 'notes']);
        }
        
        // Apply filters
        if (vendor) {
            results = results.filter(r => r.vendor === vendor);
        }
        if (storage) {
            results = results.filter(r => r.storage === storage);
        }
        
        this.filtered = results;
        this.sorted = false;
        this.updateFilters();
        this.display();
    },
    
    updateFilters() {
        // Update vendor filter
        const vendorFilter = document.getElementById('vendorFilter');
        if (vendorFilter) {
            const currentVendor = vendorFilter.value;
            const vendors = [...new Set(this.filtered.map(r => r.vendor).filter(v => v))].sort();
            vendorFilter.innerHTML = '<option value="">All Vendors</option>' +
                vendors.map(v => `<option value="${v}" ${v === currentVendor ? 'selected' : ''}>${v}</option>`).join('');
        }
        
        // Update storage filter
        const storageFilter = document.getElementById('storageFilter');
        if (storageFilter) {
            const currentStorage = storageFilter.value;
            const storages = [...new Set(this.filtered.map(r => r.storage).filter(s => s))].sort();
            storageFilter.innerHTML = '<option value="">All Storage</option>' +
                storages.map(s => `<option value="${s}" ${s === currentStorage ? 'selected' : ''}>${s}</option>`).join('');
        }
    },
    
    display() {
        // Only reset to all data on initial load (when filtered is null/undefined)
        if (this.filtered === null || this.filtered === undefined) {
            this.filtered = [...app.data.reagents];
        }
        
        // Default: newest first (by ID number)
        if (!this.sorted && this.filtered.length > 0) {
            this.filtered.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''));
                const bNum = parseInt(b.id.replace(/\D/g, ''));
                return bNum - aNum;
            });
        }
        
        document.getElementById('reagentTotal').textContent = app.data.reagents.length;
        document.getElementById('reagentFiltered').textContent = this.filtered.length;
        
        const tbody = document.getElementById('reagentTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No reagents found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(r => `
            <tr>
                <td class="item-id">${app.esc(r.id)}</td>
                <td><strong>${app.esc(r.name)}</strong></td>
                <td>${app.esc(r.vendor)}</td>
                <td>${app.esc(r.catalog)}</td>
                <td>${app.esc(r.storage)}</td>
                <td class="notes-cell" title="${app.esc(r.notes)}">${app.esc(r.notes)}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="reagentsModule.showEdit('${r.id}')" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="reagentsModule.confirmDelete('${r.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
        
        this.updateFilters();
    },
    
    // Find the lowest available ID number
    getLowestAvailableId() {
        const existingNums = app.data.reagents
            .map(r => {
                const match = r.id.match(/RG(\d+)/);
                return match ? parseInt(match[1]) : 0;
            })
            .sort((a, b) => a - b);
        
        // Find the first gap or use next number
        let nextNum = 1;
        for (const num of existingNums) {
            if (num === nextNum) {
                nextNum++;
            } else if (num > nextNum) {
                break; // Found a gap
            }
        }
        
        return `RG${String(nextNum).padStart(3, '0')}`;
    },
    
    showAdd() {
        const nextId = this.getLowestAvailableId();
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required placeholder="e.g., RG001">
            </div>
            <div class="form-group">
                <label>Name</label>
                <input id="fName" required placeholder="e.g., Spermidine, HEPES">
            </div>
            <div class="form-group">
                <label>Vendor</label>
                <input id="fVendor" placeholder="e.g., Sigma, Thermo Fisher">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" placeholder="e.g., S0266">
            </div>
            <div class="form-group">
                <label>Storage</label>
                <input id="fStorage" placeholder="e.g., -20°C, 4°C, RT">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3" placeholder="Additional notes..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="reagentsModule.save()">Add Reagent</button>
            </div>
        `;
        
        app.showModal('Add Reagent', form);
    },
    
    save() {
        const id = document.getElementById('fId').value.trim();
        const name = document.getElementById('fName').value.trim();
        
        if (!id) {
            alert('ID is required');
            return;
        }
        if (!name) {
            alert('Name is required');
            return;
        }
        
        // Check if ID already exists
        if (app.data.reagents.some(r => r.id === id)) {
            alert('This ID already exists. Please choose a different ID.');
            return;
        }
        
        const reagent = {
            id: id,
            name: name,
            vendor: document.getElementById('fVendor').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            storage: document.getElementById('fStorage').value.trim(),
            notes: document.getElementById('fNotes').value.trim(),
            dateAdded: new Date().toISOString().split('T')[0]
        };
        
        app.data.reagents.push(reagent);
        app.saveData('reagents', app.data.reagents);
        
        app.closeModal();
        this.filtered = [...app.data.reagents];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const reagent = app.data.reagents.find(r => r.id === id);
        if (!reagent) return;
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(reagent.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Name</label>
                <input id="fName" value="${app.esc(reagent.name)}" required>
            </div>
            <div class="form-group">
                <label>Vendor</label>
                <input id="fVendor" value="${app.esc(reagent.vendor)}">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" value="${app.esc(reagent.catalog)}">
            </div>
            <div class="form-group">
                <label>Storage</label>
                <input id="fStorage" value="${app.esc(reagent.storage)}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3">${app.esc(reagent.notes)}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="reagentsModule.update('${reagent.id}')">Update Reagent</button>
            </div>
        `;
        
        app.showModal('Edit Reagent', form);
    },
    
    update(id) {
        const index = app.data.reagents.findIndex(r => r.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        if (!name) {
            alert('Name is required');
            return;
        }
        
        app.data.reagents[index] = {
            ...app.data.reagents[index],
            name: name,
            vendor: document.getElementById('fVendor').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            storage: document.getElementById('fStorage').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        app.saveData('reagents', app.data.reagents);
        
        app.closeModal();
        this.filtered = [...app.data.reagents];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const reagent = app.data.reagents.find(r => r.id === id);
        if (!reagent) return;
        
        const content = `
            <p>Are you sure you want to delete this reagent?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(reagent.id)}</strong> - ${app.esc(reagent.name)}<br>
                <small style="color:#666;">${app.esc(reagent.vendor)} ${reagent.catalog ? '(' + app.esc(reagent.catalog) + ')' : ''}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="reagentsModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Reagent', content);
    },
    
    delete(id) {
        app.data.reagents = app.data.reagents.filter(r => r.id !== id);
        app.saveData('reagents', app.data.reagents);
        
        app.closeModal();
        this.filtered = [...app.data.reagents];
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
        const headers = ['ID', 'Name', 'Vendor', 'Catalog #', 'Storage', 'Notes', 'Date Added'];
        const data = this.filtered.map(r => [
            r.id,
            r.name,
            r.vendor,
            r.catalog,
            r.storage,
            r.notes,
            r.dateAdded || ''
        ]);
        
        app.exportCSV('reagents', headers, data);
    }
};
