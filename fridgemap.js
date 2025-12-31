// Fridge Map Module
// Visual representation of 4°C fridge contents by shelf

const fridgemapModule = {
    filtered: null,
    sortField: null,
    sortDir: 'asc',
    sorted: false,
    expandedShelves: {},
    
    init() {
        // Expand all shelves by default
        for (let i = 1; i <= 6; i++) {
            this.expandedShelves[i] = true;
        }
    },
    
    render() {
        return `
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchFridge" 
                           placeholder="Search fridge contents by item, category, shelf..."
                           oninput="fridgemapModule.handleSearch()">
                    <select id="shelfFilter" onchange="fridgemapModule.handleSearch()">
                        <option value="">All Shelves</option>
                        <option value="1">Shelf 1</option>
                        <option value="2">Shelf 2</option>
                        <option value="3">Shelf 3</option>
                        <option value="4">Shelf 4</option>
                        <option value="5">Shelf 5</option>
                        <option value="6">Shelf 6</option>
                    </select>
                    <select id="categoryFilter" onchange="fridgemapModule.handleSearch()">
                        <option value="">All Categories</option>
                    </select>
                    <button class="btn btn-primary" onclick="fridgemapModule.showAdd()">+ Add Item</button>
                    <button class="btn export-btn" onclick="fridgemapModule.export()">Export</button>
                </div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total Items:</span>
                        <span class="stat-number" id="fridgeTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Showing:</span>
                        <span class="stat-number" id="fridgeFiltered">0</span>
                    </div>
                </div>
            </div>
            <div class="fridge-container" id="fridgeContainer">
                <div class="fridge-title">🧊 Communal Large Upright Fridge (4°C)</div>
                <div class="fridge-body" id="fridgeBody"></div>
            </div>
            <style>
                .fridge-container {
                    max-width: 900px;
                    margin: 20px auto;
                    background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
                    border: 3px solid #888;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .fridge-title {
                    text-align: center;
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #333;
                    padding: 10px;
                    background: linear-gradient(135deg, #4a90a4 0%, #357abd 100%);
                    color: white;
                    border-radius: 8px;
                    margin-bottom: 15px;
                }
                .fridge-body {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .shelf {
                    background: white;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: all 0.2s;
                }
                .shelf:hover {
                    border-color: #4a90a4;
                }
                .shelf-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    cursor: pointer;
                    user-select: none;
                }
                .shelf-header:hover {
                    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
                }
                .shelf-number {
                    font-weight: bold;
                    font-size: 1.1em;
                    color: #4a90a4;
                }
                .shelf-summary {
                    color: #666;
                    font-size: 0.9em;
                }
                .shelf-toggle {
                    font-size: 1.2em;
                    color: #666;
                    transition: transform 0.2s;
                }
                .shelf-toggle.expanded {
                    transform: rotate(180deg);
                }
                .shelf-content {
                    display: none;
                    padding: 15px;
                    border-top: 1px solid #eee;
                }
                .shelf-content.expanded {
                    display: block;
                }
                .category {
                    margin-bottom: 15px;
                }
                .category:last-child {
                    margin-bottom: 0;
                }
                .category-name {
                    font-weight: 600;
                    color: #333;
                    padding: 8px 12px;
                    background: #f0f7ff;
                    border-left: 4px solid #4a90a4;
                    margin-bottom: 8px;
                    border-radius: 0 4px 4px 0;
                }
                .category-items {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    padding-left: 16px;
                }
                .item-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 8px;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    font-size: 0.85em;
                    transition: all 0.15s;
                    cursor: default;
                }
                .item-chip:hover {
                    background: #f8f9fa;
                    border-color: #4a90a4;
                }
                .item-chip .item-actions {
                    display: inline-flex;
                    gap: 1px;
                    opacity: 0.3;
                    transition: opacity 0.15s;
                }
                .item-chip:hover .item-actions {
                    opacity: 1;
                }
                .item-chip .btn-micro {
                    padding: 1px 4px;
                    font-size: 0.7em;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                }
                .empty-shelf {
                    color: #999;
                    font-style: italic;
                    padding: 20px;
                    text-align: center;
                }
                .search-highlight {
                    background: #fff3cd;
                    border-color: #ffc107 !important;
                }
            </style>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchFridge').value.toLowerCase();
        const shelfFilter = document.getElementById('shelfFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        let results = app.data.fridgemap || [];
        
        // Apply search
        if (query) {
            results = results.filter(item => 
                item.name.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                (item.notes && item.notes.toLowerCase().includes(query))
            );
        }
        
        // Apply shelf filter
        if (shelfFilter) {
            results = results.filter(item => String(item.shelf) === shelfFilter);
        }
        
        // Apply category filter
        if (categoryFilter) {
            results = results.filter(item => item.category === categoryFilter);
        }
        
        this.filtered = results;
        this.updateCategoryFilter();
        this.display();
    },
    
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        const data = this.filtered || app.data.fridgemap || [];
        const currentCategory = categoryFilter.value;
        const categories = [...new Set(data.map(item => item.category).filter(c => c))].sort();
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(c => `<option value="${c}" ${c === currentCategory ? 'selected' : ''}>${c}</option>`).join('');
    },
    
    display() {
        const allData = app.data.fridgemap || [];
        
        if (this.filtered === null || this.filtered === undefined) {
            this.filtered = [...allData];
        }
        
        document.getElementById('fridgeTotal').textContent = allData.length;
        document.getElementById('fridgeFiltered').textContent = this.filtered.length;
        
        const fridgeBody = document.getElementById('fridgeBody');
        
        if (allData.length === 0) {
            fridgeBody.innerHTML = '<div class="empty-shelf">No items in fridge. Click "+ Add Item" to add contents.</div>';
            return;
        }
        
        // Group by shelf, then by category
        const shelves = {};
        for (let i = 1; i <= 6; i++) {
            shelves[i] = {};
        }
        
        this.filtered.forEach(item => {
            const shelf = item.shelf || 1;
            const category = item.category || 'Uncategorized';
            if (!shelves[shelf]) shelves[shelf] = {};
            if (!shelves[shelf][category]) shelves[shelf][category] = [];
            shelves[shelf][category].push(item);
        });
        
        let html = '';
        for (let shelfNum = 1; shelfNum <= 6; shelfNum++) {
            const categories = shelves[shelfNum];
            const categoryNames = Object.keys(categories).sort();
            const itemCount = categoryNames.reduce((sum, cat) => sum + categories[cat].length, 0);
            const isExpanded = this.expandedShelves[shelfNum];
            
            html += `
                <div class="shelf">
                    <div class="shelf-header" onclick="fridgemapModule.toggleShelf(${shelfNum})">
                        <div>
                            <span class="shelf-number">Shelf ${shelfNum}</span>
                            <span class="shelf-summary">${itemCount} items in ${categoryNames.length} categories</span>
                        </div>
                        <span class="shelf-toggle ${isExpanded ? 'expanded' : ''}">▼</span>
                    </div>
                    <div class="shelf-content ${isExpanded ? 'expanded' : ''}">
            `;
            
            if (categoryNames.length === 0) {
                html += '<div class="empty-shelf">Empty shelf</div>';
            } else {
                categoryNames.forEach(category => {
                    const items = categories[category];
                    html += `
                        <div class="category">
                            <div class="category-name">${app.esc(category)}</div>
                            <div class="category-items">
                                ${items.map(item => `
                                    <div class="item-chip" title="${app.esc(item.notes || '')}">
                                        <span>${app.esc(item.name)}</span>
                                        <span class="item-actions">
                                            <button class="btn-micro" onclick="event.stopPropagation(); fridgemapModule.showEdit('${item.id}')" title="Edit">✏️</button>
                                            <button class="btn-micro" onclick="event.stopPropagation(); fridgemapModule.confirmDelete('${item.id}')" title="Delete">🗑️</button>
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        fridgeBody.innerHTML = html;
        this.updateCategoryFilter();
    },
    
    toggleShelf(shelfNum) {
        this.expandedShelves[shelfNum] = !this.expandedShelves[shelfNum];
        this.display();
    },
    
    getLowestAvailableId() {
        const data = app.data.fridgemap || [];
        const existingNums = data
            .map(item => {
                const match = item.id.match(/FR(\d+)/);
                return match ? parseInt(match[1]) : 0;
            })
            .sort((a, b) => a - b);
        
        let nextNum = 1;
        for (const num of existingNums) {
            if (num === nextNum) {
                nextNum++;
            } else if (num > nextNum) {
                break;
            }
        }
        
        return `FR${String(nextNum).padStart(3, '0')}`;
    },
    
    getCategories() {
        const data = app.data.fridgemap || [];
        return [...new Set(data.map(item => item.category).filter(c => c))].sort();
    },
    
    showAdd() {
        const nextId = this.getLowestAvailableId();
        const categories = this.getCategories();
        const categoryOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${nextId}" required>
            </div>
            <div class="form-group">
                <label>Shelf</label>
                <select id="fShelf" required>
                    <option value="1">Shelf 1</option>
                    <option value="2">Shelf 2</option>
                    <option value="3">Shelf 3</option>
                    <option value="4">Shelf 4</option>
                    <option value="5">Shelf 5</option>
                    <option value="6">Shelf 6</option>
                </select>
            </div>
            <div class="form-group">
                <label>Category</label>
                <input id="fCategory" list="categoryList" placeholder="e.g., Affinity resins, Antibiotics" required>
                <datalist id="categoryList">
                    ${categoryOptions}
                </datalist>
            </div>
            <div class="form-group">
                <label>Item Name</label>
                <input id="fName" required placeholder="e.g., Protein A, Ampicillin">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2" placeholder="Additional details..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="fridgemapModule.save()">Add Item</button>
            </div>
        `;
        
        app.showModal('Add Fridge Item', form);
    },
    
    save() {
        const id = document.getElementById('fId').value.trim();
        const name = document.getElementById('fName').value.trim();
        const category = document.getElementById('fCategory').value.trim();
        const shelf = parseInt(document.getElementById('fShelf').value);
        
        if (!id || !name || !category) {
            alert('ID, Name, and Category are required');
            return;
        }
        
        if (!app.data.fridgemap) app.data.fridgemap = [];
        
        if (app.data.fridgemap.some(item => item.id === id)) {
            alert('This ID already exists. Please choose a different ID.');
            return;
        }
        
        const item = {
            id: id,
            shelf: shelf,
            category: category,
            name: name,
            notes: document.getElementById('fNotes').value.trim(),
            dateAdded: new Date().toISOString().split('T')[0]
        };
        
        app.data.fridgemap.push(item);
        app.saveData('fridgemap', app.data.fridgemap);
        
        app.closeModal();
        this.filtered = [...app.data.fridgemap];
        this.display();
    },
    
    showEdit(id) {
        const item = (app.data.fridgemap || []).find(i => i.id === id);
        if (!item) return;
        
        const categories = this.getCategories();
        const categoryOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        
        const form = `
            <div class="form-group">
                <label>ID</label>
                <input id="fId" value="${app.esc(item.id)}" readonly style="background:#eee;">
            </div>
            <div class="form-group">
                <label>Shelf</label>
                <select id="fShelf" required>
                    ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${item.shelf === n ? 'selected' : ''}>Shelf ${n}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Category</label>
                <input id="fCategory" list="categoryList" value="${app.esc(item.category)}" required>
                <datalist id="categoryList">
                    ${categoryOptions}
                </datalist>
            </div>
            <div class="form-group">
                <label>Item Name</label>
                <input id="fName" value="${app.esc(item.name)}" required>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="fNotes" rows="2">${app.esc(item.notes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="fridgemapModule.update('${item.id}')">Update Item</button>
            </div>
        `;
        
        app.showModal('Edit Fridge Item', form);
    },
    
    update(id) {
        const index = (app.data.fridgemap || []).findIndex(i => i.id === id);
        if (index === -1) return;
        
        const name = document.getElementById('fName').value.trim();
        const category = document.getElementById('fCategory').value.trim();
        
        if (!name || !category) {
            alert('Name and Category are required');
            return;
        }
        
        app.data.fridgemap[index] = {
            ...app.data.fridgemap[index],
            shelf: parseInt(document.getElementById('fShelf').value),
            category: category,
            name: name,
            notes: document.getElementById('fNotes').value.trim()
        };
        
        app.saveData('fridgemap', app.data.fridgemap);
        
        app.closeModal();
        this.filtered = [...app.data.fridgemap];
        this.display();
    },
    
    confirmDelete(id) {
        const item = (app.data.fridgemap || []).find(i => i.id === id);
        if (!item) return;
        
        const content = `
            <p>Are you sure you want to delete this item?</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                <strong>${app.esc(item.name)}</strong><br>
                <small style="color:#666;">Shelf ${item.shelf} - ${app.esc(item.category)}</small>
            </div>
            <p style="color:#dc3545;font-size:14px;">⚠️ This action cannot be undone.</p>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="fridgemapModule.delete('${id}')" style="background:#dc3545;">Delete</button>
            </div>
        `;
        
        app.showModal('Delete Fridge Item', content);
    },
    
    delete(id) {
        app.data.fridgemap = (app.data.fridgemap || []).filter(i => i.id !== id);
        app.saveData('fridgemap', app.data.fridgemap);
        
        app.closeModal();
        this.filtered = [...app.data.fridgemap];
        this.display();
    },
    
    export() {
        const data = this.filtered || app.data.fridgemap || [];
        const headers = ['ID', 'Shelf', 'Category', 'Name', 'Notes', 'Date Added'];
        const rows = data.map(item => [
            item.id,
            item.shelf,
            item.category,
            item.name,
            item.notes || '',
            item.dateAdded || ''
        ]);
        
        app.exportCSV('fridge_map', headers, rows);
    }
};
