// Dashboard JavaScript
async function loadDashboardData() {
    try {
        const orders = await window.DB.getAllRecords('Orders');
        const products = await window.DB.getAllRecords('Products');
        const inventory = await window.DB.getAllRecords('Inventory');
        
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date && o.date.split('T')[0] === today);
        
        // Today's sales
        let todaySales = 0;
        todayOrders.forEach(order => {
            if (order.status === 'Completed') {
                todaySales += parseFloat(order.totalAmount || 0);
            }
        });
        document.getElementById('todaySales').textContent = '₱' + todaySales.toFixed(2);
        
        // Total orders
        document.getElementById('totalOrders').textContent = orders.length;
        
        // Total products
        document.getElementById('totalProducts').textContent = products.length;
        
        // Low stock
        const lowStockItems = inventory.filter(item => parseFloat(item.quantity) <= parseFloat(item.minimumStock || 0));
        document.getElementById('lowStock').textContent = lowStockItems.length;
        
        // Total revenue
        let totalRevenue = 0;
        orders.forEach(order => {
            if (order.status === 'Completed') {
                totalRevenue += parseFloat(order.totalAmount || 0);
            }
        });
        document.getElementById('totalRevenue').textContent = '₱' + totalRevenue.toFixed(2);
        
        // Recent transactions
        const recentTransactionsDiv = document.getElementById('recentTransactions');
        const recentOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        if (recentOrders.length === 0) {
            recentTransactionsDiv.innerHTML = '<tr><td colspan="4" style="text-align: center;">No transactions yet</td></tr>';
        } else {
            recentTransactionsDiv.innerHTML = recentOrders.map(order => {
                const statusClass = 'status-' + order.status.toLowerCase();
                const orderDate = order.date ? new Date(order.date).toLocaleDateString() : 'N/A';
                return `
                    <tr>
                        <td>${order.orderNumber || order.orderId}</td>
                        <td>${orderDate}</td>
                        <td>₱${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    </tr>
                `;
            }).join('');
        }
        
        // Low stock alerts
        const lowStockAlertsDiv = document.getElementById('lowStockAlerts');
        if (lowStockItems.length === 0) {
            lowStockAlertsDiv.innerHTML = '<p style="text-align: center; color: var(--success);">All items in stock ✓</p>';
        } else {
            lowStockAlertsDiv.innerHTML = lowStockItems.slice(0, 5).map(item => {
                return `
                    <div class="low-stock-item">
                        <strong>${item.name}</strong><br>
                        <span>Current: ${item.quantity} ${item.unit} | Min: ${item.minimumStock} ${item.unit}</span>
                    </div>
                `;
            }).join('') + (lowStockItems.length > 5 ? '<p style="text-align: center; font-size: 12px; color: var(--light-brown);">+' + (lowStockItems.length - 5) + ' more items</p>' : '');
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}
