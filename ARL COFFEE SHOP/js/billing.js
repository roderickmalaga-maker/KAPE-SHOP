// Billing/Receipt Management
async function loadReceipt() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        
        if (!orderId) {
            document.getElementById('receipt').innerHTML = '<p style="text-align: center;">No order specified</p>';
            return;
        }
        
        const order = await window.DB.getRecord('Orders', orderId);
        const orderItems = await window.DB.getByIndex('OrderItems', 'orderId', orderId);
        const products = await window.DB.getAllRecords('Products');
        
        // Receipt info
        const receiptInfo = document.getElementById('receiptInfo');
        receiptInfo.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>Receipt #:</span>
                <span>${order.orderNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Date:</span>
                <span>${new Date(order.date).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Time:</span>
                <span>${new Date(order.date).toLocaleTimeString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Status:</span>
                <span>${order.status}</span>
            </div>
        `;
        
        // Receipt items
        const receiptItems = document.getElementById('receiptItems');
        let itemsHtml = '';
        orderItems.forEach(item => {
            const product = products.find(p => p.productId === item.productId);
            const productName = product ? product.name : 'Unknown';
            itemsHtml += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>${productName}</span>
                        <span>₱${item.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        ${item.quantity} x ₱${item.price.toFixed(2)}
                    </div>
                </div>
            `;
        });
        receiptItems.innerHTML = itemsHtml;
        
        // Receipt totals
        const receiptTotals = document.getElementById('receiptTotals');
        receiptTotals.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₱${order.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Discount:</span>
                <span>₱${order.discount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 15px; margin-top: 5px;">
                <span>TOTAL:</span>
                <span>₱${order.totalAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span>Payment:</span>
                <span>${order.paymentMethod}</span>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        document.getElementById('receipt').innerHTML = '<p style="text-align: center; color: var(--danger);">Error loading receipt</p>';
    }
}
