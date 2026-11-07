// Customer Dashboard
async function loadCustomerDashboard() {
    try {
        const products = await window.DB.getAllRecords('Products');
        const categories = await window.DB.getAllRecords('Categories');
        
        // Featured products (first 4)
        const featuredDiv = document.getElementById('featuredProducts');
        featuredDiv.innerHTML = '';
        products.slice(0, 4).forEach(product => {
            if (product.availability) {
                const card = document.createElement('div');
                card.style.cssText = 'border: 2px solid var(--beige); padding: 15px; border-radius: 8px; text-align: center;';
                card.innerHTML = `
                    <div style="font-size: 40px; margin-bottom: 8px;">☕</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${product.name}</div>
                    <div style="color: var(--primary-brown); font-weight: 600; margin-bottom: 10px;">₱${product.price.toFixed(2)}</div>
                    <a href="customer-products.html" class="btn" style="background-color: var(--primary-brown); color: white; padding: 6px 12px; font-size: 12px;">View</a>
                `;
                featuredDiv.appendChild(card);
            }
        });
        
        // Categories
        const categoriesDiv = document.getElementById('categories');
        categoriesDiv.innerHTML = '';
        categories.forEach(cat => {
            const catLink = document.createElement('a');
            catLink.href = 'customer-products.html?cat=' + cat.categoryId;
            catLink.style.cssText = 'padding: 12px 15px; background-color: var(--cream); border: 1px solid var(--beige); border-radius: 8px; text-decoration: none; color: var(--dark-brown); font-weight: 500;';
            catLink.textContent = cat.name;
            categoriesDiv.appendChild(catLink);
        });
    } catch (error) {
        console.error('Error loading customer dashboard:', error);
    }
}
