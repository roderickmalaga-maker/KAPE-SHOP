// Admin Dashboard JavaScript
async function loadAdminDashboard() {
    try {
        await loadPendingCashiers();
        await loadDashboardStats();
        await loadRecentUsers();
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

async function loadPendingCashiers() {
    try {
        const users = await window.DB.getAllRecords('Users');
        const pendingCashiers = users.filter(u => u.role === 'Cashier' && u.accountStatus === 'Pending');
        
        document.getElementById('pendingCashiers').textContent = pendingCashiers.length;
        
        const tbody = document.getElementById('pendingCashiersBody');
        tbody.innerHTML = '';
        
        if (pendingCashiers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted-gray);">No pending cashier approvals</td></tr>';
            return;
        }
        
        pendingCashiers.forEach(user => {
            const row = document.createElement('tr');
            const regDate = user.dateRegistered ? new Date(user.dateRegistered).toLocaleDateString() : 'N/A';
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.contactNumber || 'N/A'}</td>
                <td>${regDate}</td>
                <td>
                    <button onclick="approveCashier('${user.userId}')" class="btn" style="background: linear-gradient(135deg, #66bb6a 0%, #4CAF50 100%); color: #fff; padding: 7px 14px; font-size: 12px; margin-right: 6px;">✓ Approve</button>
                    <button onclick="rejectCashier('${user.userId}')" class="btn" style="background: linear-gradient(135deg, #ef5350 0%, #f44336 100%); color: #fff; padding: 7px 14px; font-size: 12px;">✕ Reject</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pending cashiers:', error);
    }
}

async function loadDashboardStats() {
    try {
        const users = await window.DB.getAllRecords('Users');
        const orders = await window.DB.getAllRecords('Orders');
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalOrders').textContent = orders.length;
        
        // Today's sales
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date && o.date.split('T')[0] === today && o.status === 'Completed');
        let todaySales = 0;
        todayOrders.forEach(order => {
            todaySales += parseFloat(order.totalAmount || 0);
        });
        document.getElementById('todaySales').textContent = '₱' + todaySales.toFixed(2);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentUsers() {
    try {
        const users = await window.DB.getAllRecords('Users');
        const tbody = document.getElementById('recentUsersBody');
        tbody.innerHTML = '';
        
        // Sort by registration date (newest first) and take top 5
        const recentUsers = users
            .sort((a, b) => new Date(b.dateRegistered || 0) - new Date(a.dateRegistered || 0))
            .slice(0, 5);
        
        if (recentUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No users found</td></tr>';
            return;
        }
        
        recentUsers.forEach(user => {
            const row = document.createElement('tr');
            const regDate = user.dateRegistered ? new Date(user.dateRegistered).toLocaleDateString() : 'N/A';
            const statusColor = user.accountStatus === 'Active' ? '#66bb6a' : user.accountStatus === 'Pending' ? '#ffb74d' : '#ef5350';
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.role}</td>
                <td><span style="color: ${statusColor}; font-weight: 500;">${user.accountStatus}</span></td>
                <td>${regDate}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent users:', error);
    }
}

async function approveCashier(userId) {
    if (!confirm('Approve this cashier account?')) return;
    
    try {
        const user = await window.DB.getRecord('Users', userId);
        if (user && user.role === 'Cashier') {
            user.accountStatus = 'Active';
            await window.DB.updateRecord('Users', user);
            showNotification('Cashier account approved successfully!', 'success');
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error('Error approving cashier:', error);
        showNotification('Error approving cashier account', 'error');
    }
}

async function rejectCashier(userId) {
    if (!confirm('Reject this cashier registration? This action cannot be undone.')) return;
    
    try {
        const user = await window.DB.getRecord('Users', userId);
        if (user && user.role === 'Cashier') {
            await window.DB.deleteRecord('Users', userId);
            showNotification('Cashier registration rejected', 'success');
            await loadAdminDashboard();
        }
    } catch (error) {
        console.error('Error rejecting cashier:', error);
        showNotification('Error rejecting cashier registration', 'error');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `message ${type}`;
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 14px 24px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); animation: slideIn 0.3s ease;';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
