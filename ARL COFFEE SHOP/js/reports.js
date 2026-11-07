// Sales Reports
function toggleCustomDates() {
    const period = document.getElementById('reportPeriod').value;
    document.getElementById('customDates').style.display = period === 'custom' ? 'flex' : 'none';
}

function getDateRange() {
    const period = document.getElementById('reportPeriod').value;
    const now = new Date();
    let from, to;
    
    if (period === 'daily') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'weekly') {
        const day = now.getDay();
        from = new Date(now);
        from.setDate(now.getDate() - day);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59);
    } else if (period === 'monthly') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
        const fromVal = document.getElementById('dateFrom').value;
        const toVal = document.getElementById('dateTo').value;
        from = fromVal ? new Date(fromVal) : new Date(0);
        to = toVal ? new Date(toVal + 'T23:59:59') : new Date();
    }
    return { from, to };
}

async function generateReport() {
    try {
        const { from, to } = getDateRange();
        const orders = await window.DB.getAllRecords('Orders');
        const orderItems = await window.DB.getAllRecords('OrderItems');
        const products = await window.DB.getAllRecords('Products');
        
        // Filter completed orders in range
        const filtered = orders.filter(o => {
            if (o.status !== 'Completed') return false;
            const d = new Date(o.date);
            return d >= from && d <= to;
        });
        
        // Revenue & transactions
        const revenue = filtered.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
        const txCount = filtered.length;
        const avg = txCount > 0 ? revenue / txCount : 0;
        
        document.getElementById('reportRevenue').textContent = '₱' + revenue.toFixed(2);
        document.getElementById('reportTransactions').textContent = txCount;
        document.getElementById('reportAvg').textContent = '₱' + avg.toFixed(2);
        
        // Best sellers
        const productSales = {};
        filtered.forEach(order => {
            const items = orderItems.filter(oi => oi.orderId === order.orderId);
            items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = { qty: 0, revenue: 0 };
                }
                productSales[item.productId].qty += parseFloat(item.quantity || 0);
                productSales[item.productId].revenue += parseFloat(item.subtotal || 0);
            });
        });
        
        const sortedProducts = Object.entries(productSales)
            .map(([pid, data]) => {
                const product = products.find(p => p.productId === pid);
                return { name: product ? product.name : 'Unknown', ...data };
            })
            .sort((a, b) => b.qty - a.qty);
        
        document.getElementById('reportTopProduct').textContent = sortedProducts[0] ? sortedProducts[0].name : '-';
        
        const bestSellersBody = document.getElementById('bestSellersBody');
        if (sortedProducts.length === 0) {
            bestSellersBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--muted-gray);">No sales data</td></tr>';
        } else {
            bestSellersBody.innerHTML = sortedProducts.slice(0, 10).map(p => `
                <tr>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${p.qty}</td>
                    <td>₱${p.revenue.toFixed(2)}</td>
                </tr>
            `).join('');
        }
        
        // Payment methods
        const paymentCounts = {};
        filtered.forEach(o => {
            const method = o.paymentMethod || 'Cash';
            if (!paymentCounts[method]) paymentCounts[method] = { count: 0, total: 0 };
            paymentCounts[method].count++;
            paymentCounts[method].total += parseFloat(o.totalAmount || 0);
        });
        
        const paymentDiv = document.getElementById('paymentSummary');
        const methods = Object.keys(paymentCounts);
        if (methods.length === 0) {
            paymentDiv.innerHTML = '<p style="text-align: center; color: var(--muted-gray);">No payment data</p>';
        } else {
            paymentDiv.innerHTML = methods.map(m => `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--warm-beige); font-weight: 500;">${m}</span>
                    <span style="color: var(--muted-gray);">${paymentCounts[m].count} txns</span>
                    <span style="color: var(--caramel-gold); font-weight: 600;">₱${paymentCounts[m].total.toFixed(2)}</span>
                </div>
            `).join('');
        }
        
        // Transaction details
        const txBody = document.getElementById('transactionsBody');
        const sortedOrders = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortedOrders.length === 0) {
            txBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted-gray);">No transactions in this period</td></tr>';
        } else {
            txBody.innerHTML = sortedOrders.map(o => {
                const items = orderItems.filter(oi => oi.orderId === o.orderId);
                const itemCount = items.reduce((s, i) => s + parseFloat(i.quantity || 0), 0);
                return `
                    <tr>
                        <td>${o.orderNumber || o.orderId}</td>
                        <td>${new Date(o.date).toLocaleDateString()}</td>
                        <td>${itemCount}</td>
                        <td>${o.paymentMethod || 'Cash'}</td>
                        <td>₱${parseFloat(o.totalAmount || 0).toFixed(2)}</td>
                        <td><span class="status-badge status-completed">${o.status}</span></td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
