// Cashier Dashboard
async function loadCashierDashboard() {
    try {
        const orders = await window.DB.getAllRecords('Orders');
        const orderItems = await window.DB.getAllRecords('OrderItems');
        const products = await window.DB.getAllRecords('Products');
        
        const today = new Date().toISOString().split('T')[0];
        
        const pending = orders.filter(o => o.status === 'Pending').length;
        const preparing = orders.filter(o => o.status === 'Preparing').length;
        const completedToday = orders.filter(o => o.status === 'Completed' && o.date && o.date.split('T')[0] === today).length;
        
        document.getElementById('pendingOrders').textContent = pending;
        document.getElementById('preparingOrders').textContent = preparing;
        document.getElementById('completedToday').textContent = completedToday;
        
        // Order queue
        const queueDiv = document.getElementById('orderQueue');
        const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled')
                                   .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (activeOrders.length === 0) {
            queueDiv.innerHTML = '<tr><td colspan="6" style="text-align: center;">No active orders</td></tr>';
        } else {
            queueDiv.innerHTML = '';
            for (let order of activeOrders) {
                const items = orderItems.filter(oi => oi.orderId === order.orderId);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                const orderTime = order.date ? new Date(order.date).toLocaleTimeString() : 'N/A';
                const statusClass = 'status-' + order.status.toLowerCase();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.orderNumber || order.orderId}</td>
                    <td>${orderTime}</td>
                    <td>${itemCount} item(s)</td>
                    <td>₱${order.totalAmount.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td>
                        ${order.status === 'Pending' ? `<button onclick="updateOrderStatus('${order.orderId}', 'Preparing')" class="btn" style="background: rgba(33,150,243,0.2); color: #64b5f6; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(33,150,243,0.4);">Start Preparing</button>` : ''}
                        ${order.status === 'Preparing' ? `<button onclick="updateOrderStatus('${order.orderId}', 'Completed')" class="btn" style="background: rgba(76,175,80,0.2); color: #66bb6a; padding: 6px 10px; font-size: 11px; border: 1px solid rgba(76,175,80,0.4);">Complete</button>` : ''}
                        <a href="billing.html?orderId=${order.orderId}" class="btn" style="background: var(--charcoal); color: var(--warm-beige); padding: 6px 10px; font-size: 11px; border: 1px solid var(--border-color); margin-left: 4px;">View Bill</a>
                    </td>
                `;
                queueDiv.appendChild(row);
            }
        }
    } catch (error) {
        console.error('Error loading cashier dashboard:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const order = await window.DB.getRecord('Orders', orderId);
        if (order) {
            if (status === 'Completed' && order.status !== 'Completed') {
                await deductInventoryForOrder(orderId);
            }
            order.status = status;
            await window.DB.updateRecord('Orders', order);
            alert('Order status updated to ' + status);
            loadCashierDashboard();
        }
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
                        reason: `Order completion`,
                        date: new Date().toISOString(),
                        userId: user ? user.userId : null
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error deducting inventory:', error);
    }
}
