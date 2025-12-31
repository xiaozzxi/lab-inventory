// Equipment Module
// Handles all equipment inventory functionality

const equipmentModule = {
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
                    <input type="text" class="search-input" id="searchEquipment" 
                           placeholder="Search equipment by name, vendor, catalog, location, notes..."
                           oninput="equipmentModule.handleSearch()">
                    <select id="eqVendorFilter" onchange="equipmentModule.handleSearch()">
                        <option value="">All Vendors</option>
                    </select>
                    <select id="eqLocationFilter" onchange="equipmentModule.handleSearch()">
                        <option value="">All Locations</option>
                    </select>
                    <button class="btn btn-primary" onclick="equipmentModule.showAdd()">+ Add Equipment</button>
                    <button class="btn export-btn" onclick="equipmentModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="equipmentTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Showing:</span>
                        <span class="stat-number" id="equipmentFiltered">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="equipmentModule.sort('id')">ID ↕</th>
                            <th onclick="equipmentModule.sort('name')">Name ↕</th>
                            <th onclick="equipmentModule.sort('vendor')">Vendor ↕</th>
                            <th>Catalog #</th>
                            <th onclick="equipmentModule.sort('location')">Location ↕</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="equipmentTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchEquipment').value;
        const vendor = document.getElementById('eqVendorFilter') ? document.getElementById('eqVendorFilter').value : '';
        const location = document.getElementById('eqLocationFilter') ? document.getElementById('eqLocationFilter').value : '';
        
        let results = app.data.equipment;
        
        // Apply search
        if (query) {
            results = app.search(results, query, ['id', 'name', 'vendor', 'catalog', 'location', 'notes']);
        }
        
        // Apply filters
        if (vendor) {
            results = results.filter(e => e.vendor === vendor);
        }
        if (location) {
            results = results.filter(e => e.location === location);
        }
        
        this.filtered = results;
        this.sorted = false;
        this.updateFilters();
        this.display();
    },
    
    updateFilters() {
        // Update vendor filter
        const vendorFilter = document.getElementById('eqVendorFilter');
        if (vendorFilter) {
            const currentVendor = vendorFilter.value;
            const vendors = [...new Set(this.filtered.map(e => e.vendor).filter(v => v))].sort();
            vendorFilter.innerHTML = '<option value="">All Vendors</option>' +
                vendors.map(v => `<option value="${v}" ${v === currentVendor ? 'selected' : ''}>${v}</option>`).join('');
        }
        
        // Update location filter
        const locationFilter = document.getElementById('eqLocationFilter');
        if (locationFilter) {
            const currentLocation = locationFilter.value;
            const locations = [...new Set(this.filtered.map(e => e.location).filter(l => l))].sort();
            locationFilter.innerHTML = '<option value="">All Locations</option>' +
                locations.map(l => `<option value="${l}" ${l === currentLocation ? 'selected' : ''}>${l}</option>`).join('');
        }
    },
    
    display() {
        // Only reset to all data on initial load (when filtered is null/undefined)
        if (this.filtered === null || this.filtered === undefined) {
            this.filtered = [...app.data.equipment];
        }
        
        // Default: newest first (by ID number)
        if (!this.sorted && this.filtered.length > 0) {
            this.filtered.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''));
                const bNum = parseInt(b.id.replace(/\D/g, ''));
                return bNum - aNum;
            });
        }
        
        document.getElementById('equipmentTotal').textContent = app.data.equipment.length;
        document.getElementById('equipmentFiltered').textContent = this.filtered.length;
        
        const tbody = document.getElementById('equipmentTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No equipment found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(e => `
            <tr>
                <td class="item-id">${app.esc(e.id)}</td>
                <td><strong>${app.esc(e.name)}</strong></td>
                <td>${app.esc(e.vendor)}</td>
                <td>${app.esc(e.catalog)}</td>
                <td>${app.esc(e.location)}</td>
                <td class="notes-cell" title="${app.esc(e.notes)}">${app.esc(e.notes)}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="equipmentModule.showEdit('${e.id}')" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="equipmentModule.confirmDelete('${e.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
        
        this.updateFilters();
    },
    
    // Find the lowest available ID number
    getLowestAvailableId() {
        const existingNums = app.data.equipment
            .map(e => {
                const match = e.id.match(/EQ(\d+)/);
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
        
        return `EQ${String(nextNum).padStart(3, '0')}`;
    },
    
    showAdd() {
        const nextId = this.getLowestAvailableId();
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required placeholder="e.g., EQ001">
            </div>
            <div class="form-group">
                <label>Name</label>
                <input id="fName" required placeholder="e.g., Microcentrifuge, PCR Machine">
            </div>
            <div class="form-group">
                <label>Vendor</label>
                <input id="fVendor" placeholder="e.g., Beckman, Eppendorf">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" placeholder="e.g., 355603">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input id="fLocation" placeholder="e.g., Room 101, Bench 3">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3" placeholder="Additional notes..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="equipmentModule.save()">Add Equipment</button>
            </div>
        `;
        
        app.showModal('Add Equipment', form);
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
        if (app.data.equipment.some(e => e.id === id)) {
            alert('This ID already exists. Please choose a different ID.');
            return;
        }
        
        const equipment = {
            id: id,
            name: name,
            vendor: document.getElementById('fVendor').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            location: document.getElementById('fLocation').value.trim(),
            notes: document.getElementById('fNotes').value.trim(),
            dateAdded: new Date().toISOString().split('T')[0]
        };
        
        app.data.equipment.push(equipment);
        app.saveData('equipment', app.data.equipment);
        
        app.closeModal();
        this.filtered = [...app.data.equipment];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const equipment = app.data.equipment.find(e => e.id === id);
        if (!equipment) return;
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(equipment.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Name</label>
                <input id="fName" value="${app.esc(equipment.name)}" required>
            </div>
            <div class="form-group">
                <label>Vendor</label>
                <input id="fVendor" value="${app.esc(equipment.vendor)}">
            </div>
            <div class="form-group">
                <label>Catalog Number</label>
                <input id="fCatalog" value="${app.esc(equipment.catalog)}">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input id="fLocation" value="${app.esc(equipment.location)}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="3">${app.esc(equipment.notes)}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="equipmentModule.update('${equipment.id}')">Update Equipment</button>
            </div>
        `;
        
        app.showModal('Edit Equipment', form);
    },
    
    update(id) {
        const index = app.data.equipment.findIndex(e => e.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        if (!name) {
            alert('Name is required');
            return;
        }
        
        app.data.equipment[index] = {
            ...app.data.equipment[index],
            name: name,
            vendor: document.getElementById('fVendor').value.trim(),
            catalog: document.getElementById('fCatalog').value.trim(),
            location: document.getElementById('fLocation').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        app.saveData('equipment', app.data.equipment);
        
        app.closeModal();
        this.filtered = [...app.data.equipment];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const equipment = app.data.equipment.find(e => e.id === id);
        if (!equipment) return;
        
        const content = `
            <p>Are you sure you want to delete this equipment?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(equipment.id)}</strong> - ${app.esc(equipment.name)}<br>
                <small style="color:#666;">${app.esc(equipment.vendor)} ${equipment.catalog ? '(' + app.esc(equipment.catalog) + ')' : ''}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="equipmentModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Equipment', content);
    },
    
    delete(id) {
        app.data.equipment = app.data.equipment.filter(e => e.id !== id);
        app.saveData('equipment', app.data.equipment);
        
        app.closeModal();
        this.filtered = [...app.data.equipment];
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
        const headers = ['ID', 'Name', 'Vendor', 'Catalog #', 'Location', 'Notes', 'Date Added'];
        const data = this.filtered.map(e => [
            e.id,
            e.name,
            e.vendor,
            e.catalog,
            e.location,
            e.notes,
            e.dateAdded || ''
        ]);
        
        app.exportCSV('equipment', headers, data);
    }
};
