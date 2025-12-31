// Geneblocks Module
// Handles all geneblock functionality

const geneblocksModule = {
    filtered: [],
    sortField: null,
    sortDir: 'desc',
    sorted: false,
    
    init() {
        // Module initialized
    },
    
    render() {
        return `
            <div class="dropbox-notice">
                📁 <strong>Note:</strong> Detailed sequence files (.dna) available on Dropbox: Wu Lab\\Inventory
            </div>
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchGeneblocks" 
                           placeholder="Search geneblocks by ID, name, or storage..."
                           oninput="geneblocksModule.handleSearch()">
                    <button class="btn btn-primary" onclick="geneblocksModule.showAdd()">+ Add Geneblock</button>
                    <button class="btn export-btn" onclick="geneblocksModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="geneblockTotal">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="geneblocksModule.sort('id')">ID ↕</th>
                            <th onclick="geneblocksModule.sort('name')">Name ↕</th>
                            <th>Storage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="geneblockTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchGeneblocks').value;
        this.filtered = app.search(app.data.geneblocks, query, ['id', 'name', 'storage']);
        this.sorted = false;
        this.display();
    },
    
    display() {
        if (!this.filtered || this.filtered.length === 0) {
            this.filtered = [...app.data.geneblocks];
        }
        
        // Default: newest first
        if (!this.sorted) {
            this.filtered.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''));
                const bNum = parseInt(b.id.replace(/\D/g, ''));
                return bNum - aNum;
            });
        }
        
        document.getElementById('geneblockTotal').textContent = app.data.geneblocks.length;
        
        const tbody = document.getElementById('geneblockTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">No geneblocks found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(g => `
            <tr>
                <td class="item-id">${app.esc(g.id)}</td>
                <td><strong>${app.esc(g.name)}</strong></td>
                <td>${app.esc(g.storage || '')}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="geneblocksModule.showEdit('${g.id}')" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="geneblocksModule.confirmDelete('${g.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    },
    
    showAdd() {
        const nextId = app.getNextId('geneblocks');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required>
            </div>
            <div class="form-group">
                <label>Geneblock Name</label>
                <input id="fName" required placeholder="e.g., TAAR5 126mer Y3C">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" placeholder="e.g., Freezer C, Box 1">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="geneblocksModule.save()">Save Geneblock</button>
            </div>
        `;
        
        app.showModal('Add Geneblock', form);
    },
    
    save() {
        const id = document.getElementById('fId').value.trim();
        const name = document.getElementById('fName').value.trim();
        
        if (!id || !name) {
            alert('ID and Geneblock name are required');
            return;
        }
        
        // Check for duplicate ID
        if (app.data.geneblocks.some(g => g.id === id)) {
            alert('A geneblock with this ID already exists');
            return;
        }
        
        const newGeneblock = {
            id: id,
            name: name,
            storage: document.getElementById('fStorage').value.trim(),
            createdBy: '',
            dateCreated: new Date().toISOString().split('T')[0]
        };
        
        app.data.geneblocks.push(newGeneblock);
        app.saveData('geneblocks', app.data.geneblocks);
        app.updateNextId('geneblocks', id);
        
        app.closeModal();
        this.filtered = [...app.data.geneblocks];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const geneblock = app.data.geneblocks.find(g => g.id === id);
        if (!geneblock) return;
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(geneblock.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Geneblock Name</label>
                <input id="fName" value="${app.esc(geneblock.name)}" required>
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" value="${app.esc(geneblock.storage || '')}">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="geneblocksModule.update('${geneblock.id}')">Update Geneblock</button>
            </div>
        `;
        
        app.showModal('Edit Geneblock', form);
    },
    
    update(id) {
        const index = app.data.geneblocks.findIndex(g => g.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        if (!name) {
            alert('Geneblock name is required');
            return;
        }
        
        app.data.geneblocks[index] = {
            ...app.data.geneblocks[index],
            name: name,
            storage: document.getElementById('fStorage').value.trim()
        };
        
        app.saveData('geneblocks', app.data.geneblocks);
        
        app.closeModal();
        this.filtered = [...app.data.geneblocks];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const geneblock = app.data.geneblocks.find(g => g.id === id);
        if (!geneblock) return;
        
        const content = `
            <p>Are you sure you want to delete this geneblock?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(geneblock.id)}</strong> - ${app.esc(geneblock.name)}
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="geneblocksModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Geneblock', content);
    },
    
    delete(id) {
        app.data.geneblocks = app.data.geneblocks.filter(g => g.id !== id);
        app.saveData('geneblocks', app.data.geneblocks);
        
        app.closeModal();
        this.filtered = [...app.data.geneblocks];
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
        const headers = ['ID', 'Name', 'Storage'];
        const data = this.filtered.map(g => [g.id, g.name, g.storage || '']);
        
        app.exportCSV('geneblocks', headers, data);
    }
};
