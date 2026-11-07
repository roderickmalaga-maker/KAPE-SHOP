// POS/Orders Management
let cart = [];
let products = [];
let customers = [];

async function loadPOS() {
    try {
        products = await window.DB.getAllRecords('Products');
        customers = await window.DB.getAllRecords('Customers');
        const categories = await window.DB.getAllRecords('Categories');
        
        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.categoryId;
            option.textContent = cat.name;
            categoryFilter.appendChild(option);
        });
        
        // Populate customer select
        const customerSelect = document.getElementById('customerSelect');
        customers.forEach(cust => {
            const option = document.createElement('option');
            option.value = cust.customerId;
            option.textContent = cust.fullName + ' (' + cust.contactNumber + ')';
            customerSelect.appendChild(option);
        });
        
        displayProducts();
        updateCart();
    } catch (error) {
        console.error('Error loading POS:', error);
    }
}

function displayProducts(filterCat = 'all') {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    let filteredProducts = products;
    if (filterCat !== 'all') {
        filteredProducts = products.filter(p => p.categoryId === filterCat);
    }
    
        filteredProducts.forEach(product => {
            if (product.availability) {
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid var(--border-color); background: var(--charcoal); padding: 15px; border-radius: 10px; cursor: pointer; text-align: center; transition: all 0.3s;';
                card.innerHTML = `
                    <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 5px; color: var(--white);">${product.name}</div>
                    <div style="color: var(--caramel-gold); font-weight: 600;">₱${product.price.toFixed(2)}</div>
                `;
                card.onclick = () => addToCart(product);
                card.onmouseover = () => { card.style.backgroundColor = 'rgba(196,154,108,0.15)'; card.style.borderColor = 'var(--caramel-gold)'; };
                card.onmouseout = () => { card.style.backgroundColor = 'var(--charcoal)'; card.style.borderColor = 'var(--border-color)'; };
                grid.appendChild(card);
            }
        });
}

function filterProducts() {
    const filterCat = document.getElementById('categoryFilter').value;
    displayProducts(filterCat);
}

function addToCart(product) {
    const existing = cart.find(item => item.productId === product.productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    updateCart();
}

function updateCart() {
    const cartDiv = document.getElementById('cartItems');
    cartDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartDiv.innerHTML = '<p style="text-align: center; color: var(--muted-gray); font-size: 13px; padding: 20px;">Cart is empty</p>';
    } else {
        cart.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);';
            itemDiv.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 500; font-size: 13px; color: var(--white);">${item.name}</div>
                    <div style="color: var(--caramel-gold); font-size: 12px;">₱${item.price.toFixed(2)}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="changeQuantity(${index}, -1)" style="width: 26px; height: 26px; border: 1px solid var(--border-color); background: var(--primary-black); color: var(--white); border-radius: 4px; cursor: pointer;">-</button>
                    <span style="min-width: 30px; text-align: center; font-size: 13px; color: var(--white);">${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)" style="width: 26px; height: 26px; border: 1px solid var(--border-color); background: var(--primary-black); color: var(--white); border-radius: 4px; cursor: pointer;">+</button>
                    <button onclick="removeFromCart(${index})" style="margin-left: 8px; color: #ef5350; background: none; border: none; cursor: pointer;">🗑️</button>
                </div>
            `;
            cartDiv.appendChild(itemDiv);
        });
    }
    
    calculateTotal();
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;
    
    document.getElementById('subtotal').textContent = '₱' + subtotal.toFixed(2);
    document.getElementById('total').textContent = '₱' + total.toFixed(2);
}

async function processOrder() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    const customerId = document.getElementById('customerSelect').value || null;
    
    try {
        const orderId = window.DB.generateId('ORD');
        const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
        const user = window.Auth.checkAuth();
        
        const order = {
            orderId: orderId,
            orderNumber: orderNumber,
            customerId: customerId,
            userId: user.userId,
            date: new Date().toISOString(),
            subtotal: subtotal,
            discount: discount,
            totalAmount: total,
            status: 'Pending',
            paymentMethod: 'Cash'
        };
        
        await window.DB.addRecord('Orders', order);
        
        // Add order items
        for (let item of cart) {
            const orderItemId = window.DB.generateId('OITM');
            await window.DB.addRecord('OrderItems', {
                orderItemId: orderItemId,
                orderId: orderId,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            });
        }
        
        alert('Order placed successfully! Order #: ' + orderNumber);
        
        // Clear cart
        cart = [];
        document.getElementById('discount').value = 0;
        updateCart();
        
        // Redirect to orders or billing
        if (confirm('Generate receipt now?')) {
            window.location.href = 'billing.html?orderId=' + orderId;
        }
        
    } catch (error) {
        console.error('Error processing order:', error);
        alert('Error processing order');
    }
}
