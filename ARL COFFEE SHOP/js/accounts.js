// Accounts Management
async function loadAccounts() {
    try {
        const users = await window.DB.getAllRecords('Users');
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            const regDate = user.dateRegistered ? new Date(user.dateRegistered).toLocaleDateString() : 'N/A';
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.accountStatus === 'Active' ? '<span style="color: var(--success);">Active</span>' : user.accountStatus === 'Pending' ? '<span style="color: var(--warning);">Pending</span>' : '<span style="color: var(--danger);">Inactive</span>'}</td>
                <td>${regDate}</td>
                <td>
                    ${user.accountStatus === 'Pending' && user.role === 'Cashier' ? `<button onclick="approveUser('${user.userId}')" class="btn" style="background-color: #d4edda; color: var(--success); padding: 6px 10px; font-size: 11px;">Approve</button> <button onclick="rejectUser('${user.userId}')" class="btn" style="background-color: #f8d7da; color: var(--danger); padding: 6px 10px; font-size: 11px;">Reject</button>` : ''}
                    ${user.accountStatus === 'Active' && user.role !== 'Administrator' ? `<button onclick="toggleUserStatus('${user.userId}')" class="btn" style="background-color: var(--beige); padding: 6px 10px; font-size: 11px;">Deactivate</button>` : ''}
                    ${user.accountStatus === 'Inactive' && user.role !== 'Administrator' ? `<button onclick="toggleUserStatus('${user.userId}')" class="btn" style="background-color: #d4edda; padding: 6px 10px; font-size: 11px;">Activate</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

async function approveUser(userId) {
    try {
        const user = await window.DB.getRecord('Users', userId);
        if (user) {
            user.accountStatus = 'Active';
            await window.DB.updateRecord('Users', user);
            alert('Cashier account approved');
            loadAccounts();
        }
    } catch (error) {
        console.error('Error approving user:', error);
        alert('Error approving user');
    }
}

async function rejectUser(userId) {
    if (confirm('Reject this cashier registration?')) {
        try {
            await window.DB.deleteRecord('Users', userId);
            alert('Registration rejected');
            loadAccounts();
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Error rejecting user');
        }
    }
}

async function toggleUserStatus(userId) {
    try {
        const user = await window.DB.getRecord('Users', userId);
        if (user && user.role !== 'Administrator') {
            user.accountStatus = user.accountStatus === 'Active' ? 'Inactive' : 'Active';
            await window.DB.updateRecord('Users', user);
            alert('User status updated');
            loadAccounts();
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status');
    }
}
