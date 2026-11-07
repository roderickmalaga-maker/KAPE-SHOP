// Products Management
async function loadProducts() {
    try {
        const products = await window.DB.getAllRecords('Products');
        const categories = await window.DB.getAllRecords('Categories');
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products yet</td></tr>';
            return;
        }
        
        products.forEach(product => {
            const category = categories.find(c => c.categoryId === product.categoryId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${category ? category.name : 'N/A'}</td>
                <td>₱${Number(product.price || 0).toFixed(2)}</td>
                <td>${product.availability ? '<span style="color: var(--success);">Available</span>' : '<span style="color: var(--danger);">Not Available</span>'}</td>
                <td>
                    <button onclick="editProduct('${product.productId}')" class="btn" style="background-color: var(--beige); padding: 6px 12px; font-size: 12px;">Edit</button>
                    <button onclick="deleteProduct('${product.productId}')" class="btn" style="background-color: #f8d7da; color: var(--danger); padding: 6px 12px; font-size: 12px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function showAddProduct() {
    const categories = await window.DB.getAllRecords('Categories');
    const categoryOptions = categories.map(c => `<option value="${c.categoryId}">${c.name}</option>`).join('');
    const name = prompt('Product name:'); if (name === null || !name.trim()) return;
    const description = prompt('Product description:') || '';
    const categoryId = prompt('Enter category name (' + categories.map(c=>c.name).join(', ') + '):');
    const category = categories.find(c=>c.name.toLowerCase()===String(categoryId||'').trim().toLowerCase());
    if (!category) { alert('Please enter an existing category name.'); return; }
    const price = Number(prompt('Price in PHP:'));
    if (!Number.isFinite(price) || price < 0) { alert('Enter a valid price.'); return; }
    const stock = Number(prompt('Stock quantity:', '100'));
    if (!Number.isInteger(stock) || stock < 0) { alert('Enter a valid stock quantity.'); return; }
    const image = prompt('Image path or URL (optional):') || '';
    await window.DB.addRecord('Products',{productId:window.DB.generateId('PROD'),name:name.trim(),description,categoryId:category.categoryId,price,stock,image,availability:stock>0});
    await loadProducts(); alert('Product added. It is now available in the customer menu.');
}
async function editProduct(id) {
    const product = await window.DB.getRecord('Products',id); if(!product)return;
    const categories=await window.DB.getAllRecords('Categories');
    const name=prompt('Product name:',product.name); if(name===null)return;
    const description=prompt('Description:',product.description||'') ?? product.description;
    const price=Number(prompt('Price in PHP:',String(product.price)));
    if(!Number.isFinite(price)||price<0){alert('Enter a valid price.');return;}
    const categoryName=prompt('Category ('+categories.map(c=>c.name).join(', ')+'):',categories.find(c=>c.categoryId===product.categoryId)?.name||'');
    const category=categories.find(c=>c.name.toLowerCase()===String(categoryName||'').trim().toLowerCase());
    if(!category){alert('Please enter an existing category name.');return;}
    const stock=Number(prompt('Stock quantity:',String(product.stock??100)));
    if(!Number.isInteger(stock)||stock<0){alert('Enter a valid stock quantity.');return;}
    const image=prompt('Image path or URL:',product.image||''); if(image===null)return;
    await window.DB.updateRecord('Products',{...product,name:name.trim(),description,price,categoryId:category.categoryId,stock,image,availability:stock>0&&product.availability!==false});
    await loadProducts(); alert('Product updated.');
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await window.DB.deleteRecord('Products', id);
            alert('Product deleted successfully');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    }
}
