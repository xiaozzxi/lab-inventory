// PCR Products Module
// Handles all PCR product functionality

const pcrsModule = {
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
                    <input type="text" class="search-input" id="searchPCRs" 
                           placeholder="Search PCR products by ID, name, template, primers..."
                           oninput="pcrsModule.handleSearch()">
                    <button class="btn btn-primary" onclick="pcrsModule.showAdd()">+ Add PCR</button>
                    <button class="btn export-btn" onclick="pcrsModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="pcrTotal">0</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onclick="pcrsModule.sort('id')">ID ↕</th>
                            <th onclick="pcrsModule.sort('name')">Name ↕</th>
                            <th>DNA Template</th>
                            <th>Primers</th>
                            <th>Storage</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="pcrTableBody"></tbody>
                </table>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchPCRs').value;
        this.filtered = app.search(app.data.pcrs, query, ['id', 'name', 'dnaTemplate', 'primers', 'notes', 'storage']);
        this.sorted = false;
        this.display();
    },
    
    display() {
        if (!this.filtered || this.filtered.length === 0) {
            this.filtered = [...app.data.pcrs];
        }
        
        // Default: newest first
        if (!this.sorted) {
            this.filtered.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''));
                const bNum = parseInt(b.id.replace(/\D/g, ''));
                return bNum - aNum;
            });
        }
        
        document.getElementById('pcrTotal').textContent = app.data.pcrs.length;
        
        const tbody = document.getElementById('pcrTableBody');
        
        if (this.filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No PCR products found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.filtered.map(p => `
            <tr>
                <td class="item-id">${app.esc(p.id)}</td>
                <td><strong>${app.esc(p.name)}</strong></td>
                <td>${app.esc(p.dnaTemplate)}</td>
                <td>${app.esc(p.primers)}</td>
                <td>${app.esc(p.storage || '')}</td>
                <td class="notes-cell" title="${app.esc(p.notes)}">${app.esc(p.notes)}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="pcrsModule.showEdit('${p.id}')" title="Edit">✏️</button>
                    <button class="btn-action btn-delete" onclick="pcrsModule.confirmDelete('${p.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    },
    
    showAdd() {
        const nextId = app.getNextId('pcrs');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required>
            </div>
            <div class="form-group">
                <label>PCR Product Name</label>
                <input id="fName" required placeholder="e.g., GluA2Q-FLAG">
            </div>
            <div class="form-group">
                <label>DNA Template</label>
                <input id="fTemplate" placeholder="e.g., HW418 or gb001">
            </div>
            <div class="form-group">
                <label>Primers</label>
                <input id="fPrimers" placeholder="e.g., 012+165">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" placeholder="e.g., Freezer B, Box 2">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" placeholder="Optional notes..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="pcrsModule.save()">Save PCR</button>
            </div>
        `;
        
        app.showModal('Add PCR Product', form);
    },
    
    save() {
        const id = document.getElementById('fId').value.trim();
        const name = document.getElementById('fName').value.trim();
        
        if (!id || !name) {
            alert('ID and PCR product name are required');
            return;
        }
        
        // Check for duplicate ID
        if (app.data.pcrs.some(p => p.id === id)) {
            alert('A PCR product with this ID already exists');
            return;
        }
        
        const newPCR = {
            id: id,
            name: name,
            dnaTemplate: document.getElementById('fTemplate').value.trim(),
            primers: document.getElementById('fPrimers').value.trim(),
            storage: document.getElementById('fStorage').value.trim(),
            notes: document.getElementById('fNotes').value.trim(),
            createdBy: '',
            dateCreated: new Date().toISOString().split('T')[0]
        };
        
        app.data.pcrs.push(newPCR);
        app.saveData('pcrs', app.data.pcrs);
        app.updateNextId('pcrs', id);
        
        app.closeModal();
        this.filtered = [...app.data.pcrs];
        this.sorted = false;
        this.display();
    },
    
    showEdit(id) {
        const pcr = app.data.pcrs.find(p => p.id === id);
        if (!pcr) return;
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(pcr.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>PCR Product Name</label>
                <input id="fName" value="${app.esc(pcr.name)}" required>
            </div>
            <div class="form-group">
                <label>DNA Template</label>
                <input id="fTemplate" value="${app.esc(pcr.dnaTemplate || '')}">
            </div>
            <div class="form-group">
                <label>Primers</label>
                <input id="fPrimers" value="${app.esc(pcr.primers || '')}">
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input id="fStorage" value="${app.esc(pcr.storage || '')}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes">${app.esc(pcr.notes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="pcrsModule.update('${pcr.id}')">Update PCR</button>
            </div>
        `;
        
        app.showModal('Edit PCR Product', form);
    },
    
    update(id) {
        const index = app.data.pcrs.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        if (!name) {
            alert('PCR product name is required');
            return;
        }
        
        app.data.pcrs[index] = {
            ...app.data.pcrs[index],
            name: name,
            dnaTemplate: document.getElementById('fTemplate').value.trim(),
            primers: document.getElementById('fPrimers').value.trim(),
            storage: document.getElementById('fStorage').value.trim(),
            notes: document.getElementById('fNotes').value.trim()
        };
        
        app.saveData('pcrs', app.data.pcrs);
        
        app.closeModal();
        this.filtered = [...app.data.pcrs];
        this.sorted = false;
        this.display();
    },
    
    confirmDelete(id) {
        const pcr = app.data.pcrs.find(p => p.id === id);
        if (!pcr) return;
        
        const content = `
            <p>Are you sure you want to delete this PCR product?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(pcr.id)}</strong> - ${app.esc(pcr.name)}<br>
                <small style="color:#666;">${pcr.dnaTemplate ? 'Template: ' + app.esc(pcr.dnaTemplate) : ''} ${pcr.primers ? '| Primers: ' + app.esc(pcr.primers) : ''}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="pcrsModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete PCR Product', content);
    },
    
    delete(id) {
        app.data.pcrs = app.data.pcrs.filter(p => p.id !== id);
        app.saveData('pcrs', app.data.pcrs);
        
        app.closeModal();
        this.filtered = [...app.data.pcrs];
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
        const headers = ['ID', 'Name', 'DNA Template', 'Primers', 'Storage', 'Notes'];
        const data = this.filtered.map(p => [
            p.id,
            p.name,
            p.dnaTemplate,
            p.primers,
            p.storage || '',
            p.notes
        ]);
        
        app.exportCSV('pcr_products', headers, data);
    }
};
