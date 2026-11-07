// Premium Landing Page JavaScript
let premiumProducts = [];

async function loadPremiumMenu() {
    try {
        await window.DB.initDB();
        const products = await window.DB.getAllRecords('Products');
        const categories = await window.DB.getAllRecords('Categories');
        
        premiumProducts = products.map(product => {
            const category = categories.find(c => c.categoryId === product.categoryId);
            return {
                ...product,
                categoryName: category ? category.name : 'Other'
            };
        });
        
        displayPremiumMenu('bestsellers');
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('popularMenuGrid').innerHTML = '<p class="loading-text" style="color: #d33;">Error loading menu</p>';
    }
}

function displayPremiumMenu(tab) {
    const grid = document.getElementById('popularMenuGrid');
    grid.innerHTML = '';
    
    let filtered = premiumProducts.filter(p => p.availability);
    
    // Filter by tab
    if (tab === 'bestsellers') {
        filtered = filtered.slice(0, 4);
    } else if (tab === 'hot') {
        filtered = filtered.filter(p => p.categoryName === 'Coffee');
    } else if (tab === 'iced') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes('iced'));
    } else if (tab === 'noncoffee') {
        filtered = filtered.filter(p => p.categoryName === 'Non-Coffee' || p.categoryName === 'Tea');
    } else if (tab === 'pastries') {
        filtered = filtered.filter(p => p.categoryName === 'Pastries' || p.categoryName === 'Snacks');
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="loading-text">No products in this category</p>';
        return;
    }
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'menu-product-card';
        card.innerHTML = `
            <div class="menu-product-image">☕</div>
            <div class="menu-product-content">
                <h3 class="menu-product-title">${product.name}</h3>
                <p class="menu-product-desc">${product.description || 'Freshly prepared with premium ingredients'}</p>
                <div class="menu-product-footer">
                    <span class="menu-product-price">₱${product.price.toFixed(2)}</span>
                    <a href="login.html" class="menu-product-btn">Order</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    loadPremiumMenu();
    
    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            displayPremiumMenu(tab.getAttribute('data-tab'));
        });
    });
});
