// Lab Inventory v2.3 - Core Module
// Shared utilities and app orchestration

const app = {
    currentTab: 'plasmids',
    data: {
        plasmids: [],
        pcrs: [],
        geneblocks: [],
        celllines: [],
        antibodies: [],
        reagents: [],
        equipment: [],
        fridgemap: [],
        freezer80: [],
        freezer20: [],
        buffers: []
    },
    
    // Initialize application
    init() {
        // Check authentication first
        const isLoggedIn = authModule.init();
        
        if (!isLoggedIn) {
            // Show login page
            document.getElementById('app').innerHTML = authModule.renderLoginPage();
            return;
        }
        
        // User is logged in, load the app
        this.loadAllData();
        this.renderApp();
        
        // Initialize all modules
        plasmidsModule.init();
        pcrsModule.init();
        geneblocksModule.init();
        celllinesModule.init();
        antibodiesModule.init();
        reagentsModule.init();
        equipmentModule.init();
        fridgemapModule.init();
        freezer80Module.init();
        freezer20Module.init();
        buffersModule.init();
    },
    
    renderApp() {
        document.getElementById('app').innerHTML = `
            ${authModule.renderUserHeader()}
            <div class="app-container">
                <header class="header">
                    <h1>🧬 Lab Inventory</h1>
                </header>
                <nav class="tabs" id="tabs"></nav>
                <main class="content" id="content"></main>
            </div>
        `;
        this.renderTabs();
        this.switchTab('plasmids');
    },
    
    // Check if user can edit (used by modules)
    canEdit() {
        return authModule.canEdit();
    },
    
    // Load all data from localStorage
    loadAllData() {
        this.data.plasmids = JSON.parse(localStorage.getItem('plasmidsData') || '[]');
        this.data.pcrs = JSON.parse(localStorage.getItem('pcrsData') || '[]');
        this.data.geneblocks = JSON.parse(localStorage.getItem('geneblocksData') || '[]');
        this.data.celllines = JSON.parse(localStorage.getItem('celllinesData') || '[]');
        this.data.antibodies = JSON.parse(localStorage.getItem('antibodiesData') || '[]');
        this.data.reagents = JSON.parse(localStorage.getItem('reagentsData') || '[]');
        this.data.equipment = JSON.parse(localStorage.getItem('equipmentData') || '[]');
        this.data.fridgemap = JSON.parse(localStorage.getItem('fridgemapData') || '[]');
        this.data.freezer80 = JSON.parse(localStorage.getItem('freezer80Data') || '[]');
        this.data.freezer20 = JSON.parse(localStorage.getItem('freezer20Data') || '[]');
        this.data.buffers = JSON.parse(localStorage.getItem('buffersData') || '[]');
    },
    
    // Save data to localStorage
    saveData(type, data) {
        localStorage.setItem(`${type}Data`, JSON.stringify(data));
        this.data[type] = data;
    },
    
    // Render tab navigation
    renderTabs() {
        const tabs = [
            { id: 'plasmids', name: 'Plasmids' },
            { id: 'pcrs', name: 'PCR Products' },
            { id: 'geneblocks', name: 'Geneblocks' },
            { id: 'celllines', name: 'Cell Lines' },
            { id: 'antibodies', name: 'Antibodies' },
            { id: 'reagents', name: 'Reagents' },
            { id: 'equipment', name: 'Equipment' },
            { id: 'fridgemap', name: '4°C Fridge' },
            { id: 'freezer80', name: '-80°C' },
            { id: 'freezer20', name: '-20°C' },
            { id: 'buffers', name: 'Buffers' }
        ];
        
        const tabsHTML = tabs.map(tab => 
            `<div class="tab ${tab.id === this.currentTab ? 'active' : ''}" 
                  onclick="app.switchTab('${tab.id}')">${tab.name}</div>`
        ).join('');
        
        document.getElementById('tabs').innerHTML = tabsHTML;
    },
    
    // Switch between tabs
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.toLowerCase().replace(' ', '') === tabId.replace('lines', ' lines').toLowerCase().replace(' ', '') ||
                tab.textContent.toLowerCase() === tabId.toLowerCase() ||
                (tabId === 'celllines' && tab.textContent === 'Cell Lines') ||
                (tabId === 'antibodies' && tab.textContent === 'Antibodies') ||
                (tabId === 'reagents' && tab.textContent === 'Reagents') ||
                (tabId === 'equipment' && tab.textContent === 'Equipment') ||
                (tabId === 'fridgemap' && tab.textContent === '4°C Fridge') ||
                (tabId === 'freezer80' && tab.textContent === '-80°C') ||
                (tabId === 'freezer20' && tab.textContent === '-20°C') ||
                (tabId === 'buffers' && tab.textContent === 'Buffers')) {
                tab.classList.add('active');
            }
        });
        
        // Render appropriate module
        const content = document.getElementById('content');
        
        if (tabId === 'plasmids') content.innerHTML = plasmidsModule.render();
        else if (tabId === 'pcrs') content.innerHTML = pcrsModule.render();
        else if (tabId === 'geneblocks') content.innerHTML = geneblocksModule.render();
        else if (tabId === 'celllines') content.innerHTML = celllinesModule.render();
        else if (tabId === 'antibodies') content.innerHTML = antibodiesModule.render();
        else if (tabId === 'reagents') content.innerHTML = reagentsModule.render();
        else if (tabId === 'equipment') content.innerHTML = equipmentModule.render();
        else if (tabId === 'fridgemap') content.innerHTML = fridgemapModule.render();
        else if (tabId === 'freezer80') content.innerHTML = freezer80Module.render();
        else if (tabId === 'freezer20') content.innerHTML = freezer20Module.render();
        else if (tabId === 'buffers') content.innerHTML = buffersModule.render();
        
        // Update displays
        if (tabId === 'plasmids') plasmidsModule.display();
        else if (tabId === 'pcrs') pcrsModule.display();
        else if (tabId === 'geneblocks') geneblocksModule.display();
        else if (tabId === 'celllines') celllinesModule.display();
        else if (tabId === 'antibodies') antibodiesModule.display();
        else if (tabId === 'reagents') reagentsModule.display();
        else if (tabId === 'equipment') equipmentModule.display();
        else if (tabId === 'fridgemap') fridgemapModule.display();
        else if (tabId === 'freezer80') freezer80Module.display();
        else if (tabId === 'freezer20') freezer20Module.display();
        else if (tabId === 'buffers') buffersModule.display();
    },
    
    // Shared search function - searches all fields with substring matching
    search(items, query, fields) {
        if (!query) return items;
        const q = query.toLowerCase();
        return items.filter(item =>
            fields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(q);
            })
        );
    },
    
    // Get next ID for a data type
    getNextId(type) {
        const nextIds = JSON.parse(localStorage.getItem('nextIds') || '{}');
        
        if (type === 'plasmids') {
            const maxId = Math.max(...this.data.plasmids.map(p => p.id), 0);
            return maxId + 1;
        } else if (type === 'pcrs') {
            return nextIds.pcr || 'HW0068';
        } else if (type === 'geneblocks') {
            return nextIds.geneblock || 'HWgb445';
        } else if (type === 'antibodies') {
            if (this.data.antibodies.length === 0) return 'AB001';
            const maxNum = Math.max(...this.data.antibodies.map(a => parseInt(a.id.replace(/\D/g, '')) || 0));
            return `AB${String(maxNum + 1).padStart(3, '0')}`;
        } else if (type === 'reagents') {
            if (this.data.reagents.length === 0) return 'RG001';
            const maxNum = Math.max(...this.data.reagents.map(r => {
                const match = r.id.match(/RG(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }));
            return `RG${String(maxNum + 1).padStart(3, '0')}`;
        }
    },
    
    // Update next ID after adding
    updateNextId(type, id) {
        const nextIds = JSON.parse(localStorage.getItem('nextIds') || '{}');
        
        if (type === 'plasmids') {
            // Auto-calculated, no need to store
        } else if (type === 'pcrs') {
            const num = parseInt(id.replace('HW', '')) + 1;
            nextIds.pcr = `HW${String(num).padStart(4, '0')}`;
        } else if (type === 'geneblocks') {
            const num = parseInt(id.replace('HWgb', '')) + 1;
            nextIds.geneblock = `HWgb${String(num).padStart(3, '0')}`;
        } else if (type === 'antibodies') {
            const num = parseInt(id.replace(/\D/g, '')) + 1;
            nextIds.antibody = `AB${String(num).padStart(3, '0')}`;
        } else if (type === 'reagents') {
            const num = parseInt(id.replace(/\D/g, '')) + 1;
            nextIds.reagent = `RG${String(num).padStart(3, '0')}`;
        }
        
        localStorage.setItem('nextIds', JSON.stringify(nextIds));
    },
    
    // Modal functions
    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    },
    
    // Export to CSV
    exportCSV(filename, headers, data) {
        const csv = [headers, ...data]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Escape HTML
    esc(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },
    
    // Sort data by field
    sortData(data, field, direction = 'asc') {
        return [...data].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
};
