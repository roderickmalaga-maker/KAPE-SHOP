// Landing Page JavaScript
let allMenuProducts = [];
let currentCategory = 'all';
let currentSearch = '';

async function loadMenuProducts() {
    try {
        await window.DB.initDB();
        const products = await window.DB.getAllRecords('Products');
        const categories = await window.DB.getAllRecords('Categories');
        
        allMenuProducts = products.map(product => {
            const category = categories.find(c => c.categoryId === product.categoryId);
            return {
                ...product,
                categoryName: category ? category.name : 'Other'
            };
        });
        
        displayMenuProducts();
    } catch (error) {
        console.error('Error loading menu products:', error);
        document.getElementById('menuProducts').innerHTML = '<p class="loading-text" style="color: var(--danger);">Error loading products</p>';
    }
}

function displayMenuProducts() {
    const menuDiv = document.getElementById('menuProducts');
    menuDiv.innerHTML = '';
    
    let filtered = allMenuProducts.filter(p => p.availability);
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.categoryName === currentCategory || 
            (currentCategory === 'Tea' && p.categoryName === 'Tea'));
    }
    
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(currentSearch.toLowerCase()))
        );
    }
    
    if (filtered.length === 0) {
        menuDiv.innerHTML = '<p class="loading-text">No products found</p>';
        return;
    }
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <div class="menu-card-image">☕</div>
            <div class="menu-card-content">
                <h3 class="menu-card-title">${product.name}</h3>
                <p class="menu-card-desc">${product.description || 'Delicious coffee shop product'}</p>
                <div class="menu-card-footer">
                    <span class="menu-card-price">₱${product.price.toFixed(2)}</span>
                    <span class="menu-card-status">✓ Available</span>
                </div>
            </div>
        `;
        menuDiv.appendChild(card);
    });
}

function filterMenuProducts() {
    currentSearch = document.getElementById('productSearch').value;
    displayMenuProducts();
}

function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });
    
    displayMenuProducts();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMenuProducts();
});
