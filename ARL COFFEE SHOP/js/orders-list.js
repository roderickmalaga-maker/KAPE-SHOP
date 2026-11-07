// Orders List Management
async function loadOrders() {
    try {
        const orders = await window.DB.getAllRecords('Orders');
        const orderItems = await window.DB.getAllRecords('OrderItems');
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filtered = orders;
        if (statusFilter !== 'all') {
            filtered = orders.filter(o => o.status === statusFilter);
        }
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--muted-gray);">No orders found</td></tr>';
            return;
        }
        
        filtered.forEach(order => {
            const items = orderItems.filter(oi => oi.orderId === order.orderId);
            const itemCount = items.reduce((s, i) => s + parseFloat(i.quantity || 0), 0);
            const statusClass = 'status-' + (order.status || 'pending').toLowerCase();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderNumber || order.orderId}</td>
                <td>${order.date ? new Date(order.date).toLocaleString() : 'N/A'}</td>
                <td>${itemCount}</td>
                <td>₱${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                <td>${order.paymentMethod || 'Cash'}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>
                    ${order.status === 'Pending' ? `<button onclick="setOrderStatus('${order.orderId}', 'Preparing')" class="btn" style="background: rgba(33,150,243,0.2); color: #64b5f6; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(33,150,243,0.4); margin-right: 4px;">Prepare</button>` : ''}
                    ${order.status === 'Preparing' ? `<button onclick="setOrderStatus('${order.orderId}', 'Completed')" class="btn" style="background: rgba(76,175,80,0.2); color: #66bb6a; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(76,175,80,0.4); margin-right: 4px;">Complete</button>` : ''}
                    ${order.status !== 'Completed' && order.status !== 'Cancelled' ? `<button onclick="setOrderStatus('${order.orderId}', 'Cancelled')" class="btn" style="background: rgba(244,67,54,0.2); color: #ef5350; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(244,67,54,0.4); margin-right: 4px;">Cancel</button>` : ''}
                    <a href="billing.html?orderId=${order.orderId}" class="btn" style="background: var(--charcoal); color: var(--warm-beige); padding: 6px 10px; font-size: 11px; border: 1px solid var(--border-color);">Receipt</a>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function setOrderStatus(orderId, status) {
    try {
        const order = await window.DB.getRecord('Orders', orderId);
        if (!order) return;
        if (order.status === status) return;
        
        // If completing, deduct inventory based on recipes (if any)
        if (status === 'Completed' && order.status !== 'Completed') {
            await deductInventoryForOrder(orderId);
        }
        
        order.status = status;
        await window.DB.updateRecord('Orders', order);
        alert('Order status updated to ' + status);
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status');
    }
}

async function deductInventoryForOrder(orderId) {
    try {
        const orderItems = await window.DB.getByIndex('OrderItems', 'orderId', orderId);
        const recipes = await window.DB.getAllRecords('Recipes');
        const user = window.Auth.checkAuth();
        
        for (const item of orderItems) {
            const productRecipes = recipes.filter(r => r.productId === item.productId);
            for (const recipe of productRecipes) {
                const ingredient = await window.DB.getRecord('Inventory', recipe.ingredientId);
                if (ingredient) {
                    const deductAmount = parseFloat(recipe.quantityRequired || 0) * parseFloat(item.quantity || 0);
                    ingredient.quantity = Math.max(0, parseFloat(ingredient.quantity) - deductAmount);
                    await window.DB.updateRecord('Inventory', ingredient);
                    await window.DB.addRecord('StockTransactions', {
                        transactionId: window.DB.generateId('STX'),
                        ingredientId: recipe.ingredientId,
                        type: 'deduction',
                        quantity: deductAmount,
                        reason: `Order ${orderId} completion`,
                        date: new Date().toISOString(),
                        userId: user ? user.userId : null
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error deducting inventory:', error);
        // Don't block order completion on inventory errors
    }
}
