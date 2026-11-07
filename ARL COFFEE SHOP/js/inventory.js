// Inventory Management
async function loadInventory() {
    try {
        const inventory = await window.DB.getAllRecords('Inventory');
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';
        
        const lowStockItems = inventory.filter(item => parseFloat(item.quantity) <= parseFloat(item.minimumStock || 0));
        const banner = document.getElementById('lowStockBanner');
        if (lowStockItems.length > 0) {
            banner.style.display = 'block';
            banner.innerHTML = `<strong>⚠️ Low Stock Alert:</strong> ${lowStockItems.map(i => i.name).join(', ')} ${lowStockItems.length === 1 ? 'is' : 'are'} running low.`;
        } else {
            banner.style.display = 'none';
        }
        
        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--muted-gray);">No inventory items</td></tr>';
            return;
        }
        
        inventory.forEach(item => {
            const isLow = parseFloat(item.quantity) <= parseFloat(item.minimumStock || 0);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.name)}</td>
                <td>${parseFloat(item.quantity).toFixed(2)}</td>
                <td>${escapeHtml(item.unit)}</td>
                <td>${parseFloat(item.minimumStock || 0).toFixed(2)}</td>
                <td>₱${parseFloat(item.cost || 0).toFixed(2)}</td>
                <td>${isLow ? '<span class="status-badge status-cancelled">Low Stock</span>' : '<span class="status-badge status-completed">In Stock</span>'}</td>
                <td>
                    <button onclick="showStockModal('${item.ingredientId}')" class="btn" style="background: rgba(196,154,108,0.2); color: var(--caramel-gold); padding: 6px 10px; font-size: 11px; border: 1px solid rgba(196,154,108,0.4); margin-right: 4px;">Adjust</button>
                    <button onclick="editIngredient('${item.ingredientId}')" class="btn" style="background: var(--charcoal); color: var(--warm-beige); padding: 6px 10px; font-size: 11px; border: 1px solid var(--border-color); margin-right: 4px;">Edit</button>
                    <button onclick="deleteIngredient('${item.ingredientId}')" class="btn" style="background: rgba(244,67,54,0.2); color: #ef5350; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(244,67,54,0.4);">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function showAddIngredient() {
    document.getElementById('ingredientModalTitle').textContent = 'Add Ingredient';
    document.getElementById('ingredientId').value = '';
    document.getElementById('ingredientName').value = '';
    document.getElementById('ingredientQuantity').value = '';
    document.getElementById('ingredientUnit').value = '';
    document.getElementById('ingredientMinStock').value = '';
    document.getElementById('ingredientCost').value = '';
    document.getElementById('ingredientModal').style.display = 'flex';
}

async function editIngredient(id) {
    const item = await window.DB.getRecord('Inventory', id);
    if (!item) return;
    document.getElementById('ingredientModalTitle').textContent = 'Edit Ingredient';
    document.getElementById('ingredientId').value = item.ingredientId;
    document.getElementById('ingredientName').value = item.name || '';
    document.getElementById('ingredientQuantity').value = item.quantity || 0;
    document.getElementById('ingredientUnit').value = item.unit || '';
    document.getElementById('ingredientMinStock').value = item.minimumStock || 0;
    document.getElementById('ingredientCost').value = item.cost || 0;
    document.getElementById('ingredientModal').style.display = 'flex';
}

function closeIngredientModal() {
    document.getElementById('ingredientModal').style.display = 'none';
}

async function saveIngredient(e) {
    e.preventDefault();
    const id = document.getElementById('ingredientId').value;
    const name = document.getElementById('ingredientName').value.trim();
    const quantity = parseFloat(document.getElementById('ingredientQuantity').value);
    const unit = document.getElementById('ingredientUnit').value.trim();
    const minStock = parseFloat(document.getElementById('ingredientMinStock').value);
    const cost = parseFloat(document.getElementById('ingredientCost').value);
    
    if (!name || !unit) {
        alert('Name and unit are required');
        return;
    }
    
    try {
        const user = window.Auth.checkAuth();
        if (id) {
            const item = await window.DB.getRecord('Inventory', id);
            const oldQty = parseFloat(item.quantity);
            item.name = name;
            item.quantity = quantity;
            item.unit = unit;
            item.minimumStock = minStock;
            item.cost = cost;
            await window.DB.updateRecord('Inventory', item);
            
            // Log stock transaction if quantity changed
            if (oldQty !== quantity) {
                await window.DB.addRecord('StockTransactions', {
                    transactionId: window.DB.generateId('STX'),
                    ingredientId: id,
                    type: quantity > oldQty ? 'addition' : 'deduction',
                    quantity: Math.abs(quantity - oldQty),
                    reason: 'Manual adjustment',
                    date: new Date().toISOString(),
                    userId: user ? user.userId : null
                });
            }
            alert('Ingredient updated');
        } else {
            const newId = window.DB.generateId('ING');
            await window.DB.addRecord('Inventory', {
                ingredientId: newId,
                name: name,
                quantity: quantity,
                unit: unit,
                minimumStock: minStock,
                cost: cost
            });
            await window.DB.addRecord('StockTransactions', {
                transactionId: window.DB.generateId('STX'),
                ingredientId: newId,
                type: 'addition',
                quantity: quantity,
                reason: 'Initial stock',
                date: new Date().toISOString(),
                userId: user ? user.userId : null
            });
            alert('Ingredient added');
        }
        closeIngredientModal();
        await loadInventory();
    } catch (error) {
        console.error('Error saving ingredient:', error);
        alert('Error saving ingredient');
    }
}

async function deleteIngredient(id) {
    if (!confirm('Delete this ingredient?')) return;
    try {
        await window.DB.deleteRecord('Inventory', id);
        alert('Ingredient deleted');
        await loadInventory();
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        alert('Error deleting ingredient');
    }
}

async function showStockModal(id) {
    const item = await window.DB.getRecord('Inventory', id);
    if (!item) return;
    document.getElementById('stockIngredientId').value = id;
    document.getElementById('stockItemName').textContent = `${item.name} (Current: ${item.quantity} ${item.unit})`;
    document.getElementById('stockAmount').value = '';
    document.getElementById('stockReason').value = '';
    document.getElementById('stockModal').style.display = 'flex';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
}

async function adjustStock(e) {
    e.preventDefault();
    const id = document.getElementById('stockIngredientId').value;
    const type = document.getElementById('stockType').value;
    const amount = parseFloat(document.getElementById('stockAmount').value);
    const reason = document.getElementById('stockReason').value.trim() || (type === 'add' ? 'Restock' : 'Manual deduction');
    
    try {
        const item = await window.DB.getRecord('Inventory', id);
        if (!item) return;
        
        if (type === 'deduct' && parseFloat(item.quantity) < amount) {
            alert('Cannot deduct more than available stock');
            return;
        }
        
        item.quantity = type === 'add' 
            ? parseFloat(item.quantity) + amount 
            : parseFloat(item.quantity) - amount;
        await window.DB.updateRecord('Inventory', item);
        
        const user = window.Auth.checkAuth();
        await window.DB.addRecord('StockTransactions', {
            transactionId: window.DB.generateId('STX'),
            ingredientId: id,
            type: type === 'add' ? 'addition' : 'deduction',
            quantity: amount,
            reason: reason,
            date: new Date().toISOString(),
            userId: user ? user.userId : null
        });
        
        closeStockModal();
        alert('Stock adjusted successfully');
        await loadInventory();
    } catch (error) {
        console.error('Error adjusting stock:', error);
        alert('Error adjusting stock');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
