// Cell Lines Module
// Handles all cell line functionality including visual grid

const celllinesModule = {
    filtered: [],
    currentBox: null,
    selectedWell: null,
    searchResults: [],
    
    init() {
        // Module initialized
    },
    
    render() {
        // Get ALL boxes - from cells AND from metadata (including empty boxes)
        const cellBoxes = [...new Set(app.data.celllines.map(c => c.box))];
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        const metaBoxes = Object.keys(boxMeta);
        const allBoxes = [...new Set([...cellBoxes, ...metaBoxes])].sort();
        
        this.currentBox = allBoxes[0] || 'G9-1';
        
        return `
            <div class="search-section">
                <div class="search-bar">
                    <input type="text" class="search-input" id="searchCellLines" 
                           placeholder="Search cell lines by name, box, position, maker..."
                           oninput="celllinesModule.handleSearch()">
                    <select id="boxSelect" onchange="celllinesModule.changeBox()">
                        ${allBoxes.map(b => {
                            const meta = boxMeta[b] || {};
                            const label = meta.tower ? 
                                `${b} (${meta.tower}${meta.boxNumber ? ', Box ' + meta.boxNumber : ''})` : b;
                            return `<option value="${b}">${label}</option>`;
                        }).join('')}
                    </select>
                    <button class="btn btn-primary" onclick="celllinesModule.showAddBox()">+ Add Box</button>
                    <button class="btn btn-secondary btn-small" onclick="celllinesModule.showEditBox()">Edit Box</button>
                    <button class="btn btn-primary" onclick="celllinesModule.showAdd()">+ Add Cell</button>
                    <button class="btn export-btn" onclick="celllinesModule.export()">Export</button>
                </div>
                <div class="search-results" id="searchResults"></div>
                <div class="stats">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span class="stat-number" id="cellTotal">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Available:</span>
                        <span class="stat-number" id="cellAvailable">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Used:</span>
                        <span class="stat-number" id="cellUsed">0</span>
                    </div>
                </div>
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-box filled"></div>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box used"></div>
                    <span>Used</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box empty"></div>
                    <span>Empty</span>
                </div>
            </div>
            
            <div class="grid-container">
                <div class="grid" id="cellGrid"></div>
            </div>
        `;
    },
    
    handleSearch() {
        const query = document.getElementById('searchCellLines').value;
        
        if (!query) {
            document.getElementById('searchResults').classList.remove('show');
            this.searchResults = [];
            return;
        }
        
        this.searchResults = app.search(app.data.celllines, query, 
            ['cellLine', 'box', 'position', 'category', 'madeBy']);
        
        this.displaySearchResults();
    },
    
    displaySearchResults() {
        const container = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            container.classList.remove('show');
            return;
        }
        
        // Group by cell line name
        const grouped = {};
        this.searchResults.forEach(cell => {
            if (!grouped[cell.cellLine]) {
                grouped[cell.cellLine] = [];
            }
            grouped[cell.cellLine].push({ box: cell.box, position: cell.position });
        });
        
        // Show ALL results (no limit)
        const entries = Object.entries(grouped);
        
        container.innerHTML = entries.map(([cellName, locations]) => {
            // Group consecutive positions
            const byBox = {};
            locations.forEach(loc => {
                if (!byBox[loc.box]) byBox[loc.box] = [];
                byBox[loc.box].push(loc.position);
            });
            
            const locationText = Object.entries(byBox).map(([box, positions]) => {
                positions.sort();
                const ranges = this.formatPositionRanges(positions);
                return `${box}: ${ranges}`;
            }).join('; ');
            
            const boxes = Object.keys(byBox);
            const allLocations = JSON.stringify(locations).replace(/"/g, '&quot;');
            
            return `
                <div class="search-result-item" onclick='celllinesModule.jumpToCellMulti(${allLocations})'>
                    <div class="search-result-name">${app.esc(cellName)}</div>
                    <div class="search-result-location">${locationText} (${locations.length} aliquot${locations.length > 1 ? 's' : ''})</div>
                </div>
            `;
        }).join('');
        
        container.classList.add('show');
    },
    
    formatPositionRanges(positions) {
        if (positions.length <= 3) return positions.join(', ');
        
        // Try to create ranges like A1-A5
        const byRow = {};
        positions.forEach(pos => {
            const row = pos[0];
            const col = parseInt(pos.slice(1));
            if (!byRow[row]) byRow[row] = [];
            byRow[row].push(col);
        });
        
        const result = [];
        Object.entries(byRow).forEach(([row, cols]) => {
            cols.sort((a, b) => a - b);
            if (cols.length >= 3 && this.isConsecutive(cols)) {
                result.push(`${row}${cols[0]}-${row}${cols[cols.length - 1]}`);
            } else {
                cols.forEach(col => result.push(`${row}${col}`));
            }
        });
        
        return result.join(', ');
    },
    
    isConsecutive(arr) {
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[i-1] + 1) return false;
        }
        return true;
    },
    
    jumpToCell(box, position) {
        this.currentBox = box;
        document.getElementById('boxSelect').value = box;
        document.getElementById('searchResults').classList.remove('show');
        this.displayGrid();
        
        // Highlight the cell
        setTimeout(() => {
            const wells = document.querySelectorAll('.grid-well');
            wells.forEach(well => well.classList.remove('highlight'));
            
            const targetWell = document.querySelector(`[data-position="${position}"]`);
            if (targetWell) {
                targetWell.classList.add('highlight');
                targetWell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            this.selectWell(position);
        }, 100);
    },
    
    jumpToCellMulti(locations) {
        // locations = [{box, position}, ...]
        const boxes = [...new Set(locations.map(l => l.box))];
        
        if (boxes.length === 1) {
            // All in same box - highlight all
            const box = boxes[0];
            this.currentBox = box;
            document.getElementById('boxSelect').value = box;
            document.getElementById('searchResults').classList.remove('show');
            this.displayGrid();
            
            setTimeout(() => {
                locations.forEach(loc => {
                    const well = document.querySelector(`[data-position="${loc.position}"]`);
                    if (well) well.classList.add('highlight');
                });
            }, 100);
        } else {
            // Multiple boxes - ask user
            const boxList = boxes.map((b, i) => {
                const count = locations.filter(l => l.box === b).length;
                return `${i + 1}. ${b} (${count} aliquots)`;
            }).join('\n');
            
            const choice = prompt(`This cell line is in multiple boxes:\n\n${boxList}\n\nEnter box number to view (1-${boxes.length}):`);
            if (choice) {
                const idx = parseInt(choice) - 1;
                if (idx >= 0 && idx < boxes.length) {
                    const selectedBox = boxes[idx];
                    const positionsInBox = locations.filter(l => l.box === selectedBox).map(l => l.position);
                    
                    this.currentBox = selectedBox;
                    document.getElementById('boxSelect').value = selectedBox;
                    document.getElementById('searchResults').classList.remove('show');
                    this.displayGrid();
                    
                    setTimeout(() => {
                        positionsInBox.forEach(pos => {
                            const well = document.querySelector(`[data-position="${pos}"]`);
                            if (well) well.classList.add('highlight');
                        });
                    }, 100);
                }
            }
        }
    },
    
    toggleDetails() {
        const details = document.getElementById('wellDetails');
        details.classList.toggle('show');
    },
    
    display() {
        this.updateStats();
        this.displayGrid();
    },
    
    updateStats() {
        document.getElementById('cellTotal').textContent = app.data.celllines.length;
        document.getElementById('cellAvailable').textContent = 
            app.data.celllines.filter(c => c.available).length;
        document.getElementById('cellUsed').textContent = 
            app.data.celllines.filter(c => !c.available).length;
    },
    
    changeBox() {
        this.currentBox = document.getElementById('boxSelect').value;
        this.displayGrid();
    },
    
    displayGrid() {
        const boxCells = app.data.celllines.filter(c => c.box === this.currentBox);
        
        let html = '<div class="grid-header"></div>';
        for (let i = 1; i <= 9; i++) {
            html += `<div class="grid-header">${i}</div>`;
        }
        
        ['A','B','C','D','E','F','G','H','I'].forEach(row => {
            html += `<div class="grid-header">${row}</div>`;
            for (let col = 1; col <= 9; col++) {
                const pos = `${row}${col}`;
                const cell = boxCells.find(c => c.position === pos);
                
                if (cell) {
                    const cls = cell.available ? 'filled' : 'used';
                    const name = cell.cellLine.length > 25 ? 
                        cell.cellLine.substring(0, 22) + '...' : cell.cellLine;
                    
                    html += `<div class="grid-well ${cls}" data-position="${pos}"
                                  onmouseenter="celllinesModule.showTooltip(event, '${pos}')">
                                ${app.esc(name)}
                             </div>`;
                } else {
                    html += `<div class="grid-well empty" data-position="${pos}"
                                  onclick="celllinesModule.showAddAtPosition('${pos}')"
                                  title="Empty - Click to add cell">
                             </div>`;
                }
            }
        });
        
        document.getElementById('cellGrid').innerHTML = html;
    },
    
    showTooltip(event, position) {
        const cell = app.data.celllines.find(c => 
            c.box === this.currentBox && c.position === position);
        
        if (!cell) return;
        
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'cellTooltip';
        tooltip.className = 'cell-tooltip';
        
        // Keep tooltip open when hovering over it
        tooltip.onmouseenter = () => {
            clearTimeout(this.tooltipTimeout);
        };
        tooltip.onmouseleave = () => {
            this.hideTooltip();
        };
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${app.esc(cell.cellLine)}</strong>
                <button class="tooltip-close" onclick="celllinesModule.hideTooltip()">×</button>
            </div>
            <div class="tooltip-body">
                <div class="tooltip-row">
                    <span class="tooltip-label">Position:</span>
                    <span class="tooltip-value">${cell.box}-${cell.position}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Category:</span>
                    <span class="tooltip-value">${app.esc(cell.category || 'N/A')}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Made by:</span>
                    <span class="tooltip-value">${app.esc(cell.madeBy || 'Unknown')}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Tower:</span>
                    <span class="tooltip-value">${app.esc(cell.tower || 'N/A')}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Status:</span>
                    <span class="tooltip-value ${cell.available ? 'status-available' : 'status-used'}">
                        ${cell.available ? '✅ Available' : '❌ Used'}
                    </span>
                </div>
            </div>
            <div class="tooltip-actions">
                <button class="btn btn-primary btn-small" onclick="celllinesModule.toggleAvailabilityFromTooltip('${cell.box}', '${position}')">
                    Toggle Availability
                </button>
                <button class="btn btn-secondary btn-small" onclick="celllinesModule.deleteCellFromTooltip('${cell.box}', '${position}')">
                    Delete
                </button>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip near mouse
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 10) + 'px';
        
        // Store current position for actions
        this.tooltipPosition = { box: cell.box, position: position };
        
        // Add mouseleave to grid cell to hide tooltip after delay
        event.target.onmouseleave = () => {
            this.tooltipTimeout = setTimeout(() => {
                const tooltip = document.getElementById('cellTooltip');
                if (tooltip && !tooltip.matches(':hover')) {
                    this.hideTooltip();
                }
            }, 300); // 300ms delay before checking
        };
    },
    
    hideTooltip() {
        const tooltip = document.getElementById('cellTooltip');
        if (tooltip) {
            tooltip.remove();
        }
    },
    
    toggleAvailabilityFromTooltip(box, position) {
        const cell = app.data.celllines.find(c => c.box === box && c.position === position);
        if (cell) {
            cell.available = !cell.available;
            app.saveData('celllines', app.data.celllines);
            this.hideTooltip();
            this.display();
        }
    },
    
    deleteCellFromTooltip(box, position) {
        const cell = app.data.celllines.find(c => c.box === box && c.position === position);
        if (cell && confirm(`Delete ${cell.cellLine} from ${box}:${position}?`)) {
            app.data.celllines = app.data.celllines.filter(c => 
                !(c.box === box && c.position === position));
            app.saveData('celllines', app.data.celllines);
            this.hideTooltip();
            this.display();
        }
    },
    
    selectWell(position) {
        this.selectedWell = position;
        const cell = app.data.celllines.find(c => 
            c.box === this.currentBox && c.position === position);
        
        if (!cell) return;
        
        document.getElementById('wellInfo').innerHTML = `
            <dt>Position:</dt>
            <dd>${cell.box} - ${cell.position}</dd>
            <dt>Cell Line:</dt>
            <dd><strong>${app.esc(cell.cellLine)}</strong></dd>
            <dt>Category:</dt>
            <dd>${app.esc(cell.category || 'N/A')}</dd>
            <dt>Made by:</dt>
            <dd>${app.esc(cell.madeBy || 'Unknown')}</dd>
            <dt>Tower:</dt>
            <dd>${app.esc(cell.tower)}</dd>
            <dt>Status:</dt>
            <dd>${cell.available ? '✅ Available' : '❌ Used'}</dd>
        `;
        
        document.getElementById('wellDetails').classList.add('show');
    },
    
    toggleAvailability() {
        if (!this.selectedWell) {
            alert('Please select a cell first by clicking it in the grid');
            return;
        }
        
        const cell = app.data.celllines.find(c => 
            c.box === this.currentBox && c.position === this.selectedWell);
        
        if (cell) {
            cell.available = !cell.available;
            app.saveData('celllines', app.data.celllines);
            this.display();
            this.selectWell(this.selectedWell);
        }
    },
    
    deleteCell() {
        if (!this.selectedWell) {
            alert('Please select a cell first');
            return;
        }
        
        const cell = app.data.celllines.find(c => 
            c.box === this.currentBox && c.position === this.selectedWell);
        
        if (cell && confirm(`Delete ${cell.cellLine} from ${cell.box}:${cell.position}?`)) {
            app.data.celllines = app.data.celllines.filter(c => 
                !(c.box === this.currentBox && c.position === this.selectedWell));
            app.saveData('celllines', app.data.celllines);
            document.getElementById('wellDetails').classList.remove('show');
            this.display();
        }
    },
    
    showAdd(prefillBox = null, prefillPosition = null) {
        // Get ALL boxes from both cells and metadata
        const cellBoxes = [...new Set(app.data.celllines.map(c => c.box))];
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        const metaBoxes = Object.keys(boxMeta);
        const allBoxes = [...new Set([...cellBoxes, ...metaBoxes])].sort();
        
        const form = `
            <div class="form-group">
                <label>Box</label>
                <select id="fBox">
                    ${allBoxes.map(b => `<option value="${b}" ${b === (prefillBox || this.currentBox) ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Position(s) <small style="color:#999;">Single: A5 | Range: A2-A5 | Multiple: A2,A3,B1</small></label>
                <input id="fPosition" placeholder="e.g., A5 or A2-A5 or A2,A3,B1" value="${prefillPosition || ''}" required>
            </div>
            <div class="form-group">
                <label>Cell Line Name</label>
                <input id="fCellLine" required placeholder="e.g., Flp-In™ T-REx™ 293 ΔCNIH4">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="fCategory">
                    <option>Knockout</option>
                    <option>Knockin</option>
                    <option>Flp-in</option>
                    <option>Overexpression</option>
                    <option>WT</option>
                    <option>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Made by</label>
                <input id="fMadeBy" placeholder="e.g., Haoxi Wu" value="Haoxi Wu">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="celllinesModule.save()">Save Cell(s)</button>
            </div>
        `;
        
        app.showModal('Add Cell Line', form);
    },
    
    showAddAtPosition(position) {
        document.getElementById('searchResults').classList.remove('show');
        this.showAdd(this.currentBox, position);
    },
    
    parsePositions(positionInput) {
        // Parse position input: "A5" or "A2-A5" or "A2,A3,B1"
        const positions = [];
        const parts = positionInput.toUpperCase().split(',').map(p => p.trim());
        
        parts.forEach(part => {
            if (part.includes('-')) {
                // Range: A2-A5
                const [start, end] = part.split('-').map(p => p.trim());
                const startRow = start[0];
                const endRow = end[0];
                const startCol = parseInt(start.slice(1));
                const endCol = parseInt(end.slice(1));
                
                if (startRow === endRow) {
                    // Same row: A2-A5
                    for (let col = startCol; col <= endCol; col++) {
                        positions.push(startRow + col);
                    }
                } else {
                    // Different rows - not supported yet, add individually
                    positions.push(start, end);
                }
            } else {
                // Single position
                positions.push(part);
            }
        });
        
        return positions;
    },
    
    save() {
        const box = document.getElementById('fBox').value;
        const positionInput = document.getElementById('fPosition').value;
        const cellLine = document.getElementById('fCellLine').value;
        const category = document.getElementById('fCategory').value;
        const madeBy = document.getElementById('fMadeBy').value;
        
        if (!cellLine || !positionInput) {
            alert('Cell line name and position are required');
            return;
        }
        
        // Parse positions
        const positions = this.parsePositions(positionInput);
        
        if (positions.length === 0) {
            alert('Invalid position format');
            return;
        }
        
        // Check for conflicts
        const conflicts = [];
        positions.forEach(pos => {
            const existing = app.data.celllines.find(c => c.box === box && c.position === pos);
            if (existing) {
                conflicts.push(`${pos} (${existing.cellLine})`);
            }
        });
        
        if (conflicts.length > 0) {
            if (!confirm(`These positions are occupied:\n${conflicts.join('\n')}\n\nReplace them?`)) {
                return;
            }
            // Remove conflicting cells
            app.data.celllines = app.data.celllines.filter(c => 
                !(c.box === box && positions.includes(c.position)));
        }
        
        // Get tower info from metadata
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        const meta = boxMeta[box] || {};
        
        // Add all cells
        const dateAdded = new Date().toISOString().split('T')[0];
        positions.forEach(position => {
            const newCell = {
                box: box,
                position: position,
                cellLine: cellLine,
                category: category,
                madeBy: madeBy,
                available: true,
                tower: meta.tower || 'Unknown',
                boxNumber: meta.boxNumber || '',
                dateAdded: dateAdded
            };
            app.data.celllines.push(newCell);
        });
        
        app.saveData('celllines', app.data.celllines);
        
        app.closeModal();
        alert(`Added ${positions.length} aliquot(s) to ${positions.join(', ')}`);
        
        this.currentBox = box;
        document.getElementById('boxSelect').value = box;
        this.display();
    },
    
    showAddBox() {
        const form = `
            <div class="form-group">
                <label>Box Name</label>
                <input id="fBoxName" placeholder="e.g., G9-9 or G5-11" required>
            </div>
            <div class="form-group">
                <label>Tower Name</label>
                <input id="fTower" placeholder="e.g., Green 9, Green 5, Blue 3" value="Green 9">
            </div>
            <div class="form-group">
                <label>Box Number</label>
                <input id="fBoxNumber" placeholder="e.g., 9" type="number">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="celllinesModule.addBox()">Create Box</button>
            </div>
        `;
        
        app.showModal('Add New Box', form);
    },
    
    addBox() {
        const boxName = document.getElementById('fBoxName').value.trim();
        const tower = document.getElementById('fTower').value.trim();
        const boxNumber = document.getElementById('fBoxNumber').value.trim();
        
        if (!boxName) {
            alert('Box name is required');
            return;
        }
        
        // Check if box already exists
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        if (boxMeta[boxName]) {
            alert(`Box ${boxName} already exists`);
            return;
        }
        
        // Store box metadata
        boxMeta[boxName] = { 
            name: boxName,
            tower: tower || 'Unknown', 
            boxNumber: boxNumber || '' 
        };
        localStorage.setItem('boxMetadata', JSON.stringify(boxMeta));
        
        app.closeModal();
        
        // Set as current box and refresh entire tab
        this.currentBox = boxName;
        app.switchTab('celllines');
    },
    
    showEditBox() {
        const boxes = [...new Set(app.data.celllines.map(c => c.box))].sort();
        
        // Include boxes from metadata that might not have cells yet
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        const allBoxes = [...new Set([...boxes, ...Object.keys(boxMeta)])].sort();
        
        const form = `
            <div class="form-group">
                <label>Select Box to Edit</label>
                <select id="fEditBox" onchange="celllinesModule.loadBoxMeta()">
                    ${allBoxes.map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Tower Name</label>
                <input id="fEditTower" placeholder="e.g., Green 9, Blue 3">
            </div>
            <div class="form-group">
                <label>Box Number</label>
                <input id="fEditBoxNumber" placeholder="e.g., 9">
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="celllinesModule.deleteBox()">Delete Box</button>
                <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="celllinesModule.saveBoxEdit()">Save Changes</button>
            </div>
        `;
        
        app.showModal('Edit Box Location', form);
        setTimeout(() => this.loadBoxMeta(), 100);
    },
    
    loadBoxMeta() {
        const boxName = document.getElementById('fEditBox').value;
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        const meta = boxMeta[boxName] || {};
        
        document.getElementById('fEditTower').value = meta.tower || '';
        document.getElementById('fEditBoxNumber').value = meta.boxNumber || '';
    },
    
    deleteBox() {
        const boxName = document.getElementById('fEditBox').value;
        
        // Check if box has cells
        const cellsInBox = app.data.celllines.filter(c => c.box === boxName);
        
        if (cellsInBox.length > 0) {
            if (!confirm(`Box ${boxName} contains ${cellsInBox.length} cell(s). Delete anyway? This will remove all cells in this box.`)) {
                return;
            }
            
            // Remove all cells in this box
            app.data.celllines = app.data.celllines.filter(c => c.box !== boxName);
            app.saveData('celllines', app.data.celllines);
        }
        
        // Remove box metadata
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        delete boxMeta[boxName];
        localStorage.setItem('boxMetadata', JSON.stringify(boxMeta));
        
        app.closeModal();
        alert(`Box ${boxName} deleted`);
        
        // Refresh
        app.switchTab('celllines');
    },
    
    saveBoxEdit() {
        const boxName = document.getElementById('fEditBox').value;
        const tower = document.getElementById('fEditTower').value;
        const boxNumber = document.getElementById('fEditBoxNumber').value;
        
        // Update all cells in this box
        app.data.celllines.forEach(cell => {
            if (cell.box === boxName) {
                cell.tower = tower;
                cell.boxNumber = boxNumber;
            }
        });
        app.saveData('celllines', app.data.celllines);
        
        // Update metadata
        const boxMeta = JSON.parse(localStorage.getItem('boxMetadata') || '{}');
        boxMeta[boxName] = { tower: tower, boxNumber: boxNumber };
        localStorage.setItem('boxMetadata', JSON.stringify(boxMeta));
        
        app.closeModal();
        
        // Refresh the entire tab to update box selector
        app.switchTab('celllines');
    },
    
    export() {
        const headers = ['Box', 'Position', 'Cell Line', 'Category', 'Made By', 'Available'];
        const data = app.data.celllines.map(c => [
            c.box,
            c.position,
            c.cellLine,
            c.category,
            c.madeBy,
            c.available ? 'Yes' : 'No'
        ]);
        
        app.exportCSV('cell_lines', headers, data);
    }
};
