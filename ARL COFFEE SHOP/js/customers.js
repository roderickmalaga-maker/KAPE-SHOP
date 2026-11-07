// Customer Management
let allCustomers = [];
let customerStats = {};

async function loadCustomers() {
    try {
        allCustomers = await window.DB.getAllRecords('Customers');
        const orders = await window.DB.getAllRecords('Orders');
        
        // Build stats per customer
        customerStats = {};
        allCustomers.forEach(c => {
            customerStats[c.customerId] = { orders: 0, spent: 0 };
        });
        orders.forEach(order => {
            if (order.customerId && customerStats[order.customerId]) {
                customerStats[order.customerId].orders += 1;
                if (order.status === 'Completed') {
                    customerStats[order.customerId].spent += parseFloat(order.totalAmount || 0);
                }
            }
        });
        
        displayCustomers(allCustomers);
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted-gray);">No customers found</td></tr>';
        return;
    }
    
    customers.forEach(customer => {
        const stats = customerStats[customer.customerId] || { orders: 0, spent: 0 };
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(customer.fullName || customer.name || 'N/A')}</td>
            <td>${escapeHtml(customer.contactNumber || '')}</td>
            <td>${escapeHtml(customer.email || '')}</td>
            <td>${stats.orders}</td>
            <td>₱${stats.spent.toFixed(2)}</td>
            <td>
                <button onclick="editCustomer('${customer.customerId}')" class="btn" style="background: var(--charcoal); color: var(--warm-beige); padding: 6px 12px; font-size: 11px; border: 1px solid var(--border-color); margin-right: 4px;">Edit</button>
                <button onclick="viewCustomerHistory('${customer.customerId}')" class="btn" style="background: var(--charcoal); color: var(--warm-beige); padding: 6px 12px; font-size: 11px; border: 1px solid var(--border-color); margin-right: 4px;">History</button>
                <button onclick="deleteCustomer('${customer.customerId}')" class="btn" style="background: rgba(244,67,54,0.2); color: #ef5350; padding: 6px 12px; font-size: 11px; border: 1px solid rgba(244,67,54,0.4);">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterCustomers() {
    const term = document.getElementById('searchCustomer').value.toLowerCase();
    const filtered = allCustomers.filter(c => 
        (c.fullName || c.name || '').toLowerCase().includes(term) ||
        (c.contactNumber || '').includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );
    displayCustomers(filtered);
}

function showAddCustomer() {
    document.getElementById('modalTitle').textContent = 'Add Customer';
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerContact').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerModal').style.display = 'flex';
}

async function editCustomer(id) {
    const customer = await window.DB.getRecord('Customers', id);
    if (!customer) return;
    document.getElementById('modalTitle').textContent = 'Edit Customer';
    document.getElementById('customerId').value = customer.customerId;
    document.getElementById('customerName').value = customer.fullName || customer.name || '';
    document.getElementById('customerContact').value = customer.contactNumber || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerModal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

async function saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('customerName').value.trim();
    const contact = document.getElementById('customerContact').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    
    if (!name || !contact) {
        alert('Name and contact number are required');
        return;
    }
    
    try {
        if (id) {
            const customer = await window.DB.getRecord('Customers', id);
            customer.fullName = name;
            customer.contactNumber = contact;
            customer.email = email;
            await window.DB.updateRecord('Customers', customer);
            alert('Customer updated successfully');
        } else {
            await window.DB.addRecord('Customers', {
                customerId: window.DB.generateId('CUST'),
                fullName: name,
                contactNumber: contact,
                email: email,
                dateAdded: new Date().toISOString()
            });
            alert('Customer added successfully');
        }
        closeCustomerModal();
        await loadCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        alert('Error saving customer');
    }
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
        await window.DB.deleteRecord('Customers', id);
        alert('Customer deleted');
        await loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer');
    }
}

async function viewCustomerHistory(id) {
    try {
        const customer = await window.DB.getRecord('Customers', id);
        const orders = await window.DB.getByIndex('Orders', 'customerId', id);
        let msg = `Order History for ${customer.fullName || customer.name}\n\n`;
        if (orders.length === 0) {
            msg += 'No orders found.';
        } else {
            orders.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(o => {
                msg += `${o.orderNumber || o.orderId} - ${new Date(o.date).toLocaleDateString()} - ₱${parseFloat(o.totalAmount||0).toFixed(2)} - ${o.status}\n`;
            });
        }
        alert(msg);
    } catch (error) {
        console.error('Error viewing history:', error);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
