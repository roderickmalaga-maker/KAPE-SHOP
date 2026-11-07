// CoffeeShopDB Database Module
// IndexedDB Implementation for Coffee Shop Management System

const DB_NAME = 'CoffeeShopDB';
const DB_VERSION = 1;

let db = null;

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Users Store
            if (!db.objectStoreNames.contains('Users')) {
                const userStore = db.createObjectStore('Users', { keyPath: 'userId' });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('username', 'username', { unique: true });
                userStore.createIndex('role', 'role', { unique: false });
                userStore.createIndex('status', 'accountStatus', { unique: false });
            }

            // Products Store
            if (!db.objectStoreNames.contains('Products')) {
                const productStore = db.createObjectStore('Products', { keyPath: 'productId' });
                productStore.createIndex('categoryId', 'categoryId', { unique: false });
                productStore.createIndex('name', 'name', { unique: false });
            }

            // Categories Store
            if (!db.objectStoreNames.contains('Categories')) {
                const categoryStore = db.createObjectStore('Categories', { keyPath: 'categoryId' });
                categoryStore.createIndex('name', 'name', { unique: true });
            }

            // Orders Store
            if (!db.objectStoreNames.contains('Orders')) {
                const orderStore = db.createObjectStore('Orders', { keyPath: 'orderId' });
                orderStore.createIndex('date', 'date', { unique: false });
                orderStore.createIndex('status', 'status', { unique: false });
                orderStore.createIndex('customerId', 'customerId', { unique: false });
            }

            // OrderItems Store
            if (!db.objectStoreNames.contains('OrderItems')) {
                const orderItemStore = db.createObjectStore('OrderItems', { keyPath: 'orderItemId' });
                orderItemStore.createIndex('orderId', 'orderId', { unique: false });
                orderItemStore.createIndex('productId', 'productId', { unique: false });
            }

            // Customers Store
            if (!db.objectStoreNames.contains('Customers')) {
                const customerStore = db.createObjectStore('Customers', { keyPath: 'customerId' });
                customerStore.createIndex('contactNumber', 'contactNumber', { unique: false });
            }

            // Inventory Store
            if (!db.objectStoreNames.contains('Inventory')) {
                const inventoryStore = db.createObjectStore('Inventory', { keyPath: 'ingredientId' });
                inventoryStore.createIndex('name', 'name', { unique: false });
            }

            // Recipes Store
            if (!db.objectStoreNames.contains('Recipes')) {
                const recipeStore = db.createObjectStore('Recipes', { keyPath: 'recipeId' });
                recipeStore.createIndex('productId', 'productId', { unique: false });
            }

            // Payments Store
            if (!db.objectStoreNames.contains('Payments')) {
                const paymentStore = db.createObjectStore('Payments', { keyPath: 'paymentId' });
                paymentStore.createIndex('orderId', 'orderId', { unique: false });
            }

            // StockTransactions Store
            if (!db.objectStoreNames.contains('StockTransactions')) {
                const stockTransStore = db.createObjectStore('StockTransactions', { keyPath: 'transactionId' });
                stockTransStore.createIndex('ingredientId', 'ingredientId', { unique: false });
                stockTransStore.createIndex('date', 'date', { unique: false });
            }

            // Settings Store
            if (!db.objectStoreNames.contains('Settings')) {
                db.createObjectStore('Settings', { keyPath: 'key' });
            }

            console.log('Database schema created');
        };
    });
}

// Generic CRUD operations
function addRecord(storeName, record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getRecord(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllRecords(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateRecord(storeName, record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteRecord(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Generate unique ID
function generateId(prefix = '') {
    return prefix + Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Password hashing using Web Crypto API
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const saltArray = Array.from(salt);
    
    return {
        hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: saltArray.map(b => b.toString(16).padStart(2, '0')).join('')
    };
}

async function verifyPassword(password, storedHash, storedSalt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const saltArray = storedSalt.match(/.{2}/g).map(byte => parseInt(byte, 16));
    const salt = new Uint8Array(saltArray);
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hash === storedHash;
}

// Initialize sample data
async function initializeSampleData() {
    const categories = await getAllRecords('Categories');
    if (categories.length === 0) {
        // Add categories
        await addRecord('Categories', { categoryId: generateId('CAT'), name: 'Coffee', description: 'Hot and cold coffee drinks' });
        await addRecord('Categories', { categoryId: generateId('CAT'), name: 'Non-Coffee', description: 'Non-caffeinated drinks' });
        await addRecord('Categories', { categoryId: generateId('CAT'), name: 'Tea', description: 'Various tea blends' });
        await addRecord('Categories', { categoryId: generateId('CAT'), name: 'Pastries', description: 'Fresh baked pastries' });
        await addRecord('Categories', { categoryId: generateId('CAT'), name: 'Snacks', description: 'Light snacks' });
        
        // Add sample products
        const catList = await getAllRecords('Categories');
        const coffeeCat = catList.find(c => c.name === 'Coffee').categoryId;
        const pastryCat = catList.find(c => c.name === 'Pastries').categoryId;
        
        await addRecord('Products', { 
            productId: generateId('PROD'), 
            name: 'Espresso', 
            categoryId: coffeeCat, 
            price: 80, 
            availability: true, 
            image: '',
            description: 'Strong black coffee'
        });
        await addRecord('Products', { 
            productId: generateId('PROD'), 
            name: 'Cappuccino', 
            categoryId: coffeeCat, 
            price: 120, 
            availability: true, 
            image: '',
            description: 'Espresso with steamed milk'
        });
        await addRecord('Products', { 
            productId: generateId('PROD'), 
            name: 'Croissant', 
            categoryId: pastryCat, 
            price: 60, 
            availability: true, 
            image: '',
            description: 'Buttery croissant'
        });
    }
    

    // Ensure the complete ARL menu exists without duplicating or deleting records.
    const menuCategories = [
        ['Coffee', 'Hot espresso-based coffee drinks'],
        ['Iced Coffee', 'Chilled coffee beverages'],
        ['Non-Coffee', 'Non-coffee beverages'],
        ['Tea', 'Tea and fruit tea beverages'],
        ['Pastries', 'Fresh baked pastries and desserts'],
        ['Snacks', 'Savory light snacks']
    ];
    let categoryRows = await getAllRecords('Categories');
    for (const [name, description] of menuCategories) {
        if (!categoryRows.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            await addRecord('Categories', { categoryId: generateId('CAT'), name, description });
        }
    }
    categoryRows = await getAllRecords('Categories');
    const categoryIdByName = Object.fromEntries(categoryRows.map(c => [c.name.toLowerCase(), c.categoryId]));
    const menuProducts = [
        ['Espresso','Coffee',85,'A rich and bold shot of freshly brewed espresso made from finely ground coffee beans, offering a strong aroma and smooth finish.'],
        ['Cappuccino','Coffee',120,'A classic Italian coffee made with rich espresso, steamed milk, and a thick layer of creamy milk foam.'],
        ['Americano','Coffee',95,'A smooth coffee made by combining freshly brewed espresso with hot water.'],
        ['Cafe Latte','Coffee',130,'A delicious blend of espresso and steamed milk, topped with a thin layer of silky milk foam.'],
        ['Caramel Latte','Coffee',150,'A creamy espresso-based drink blended with steamed milk and sweet caramel syrup.'],
        ['Vanilla Latte','Coffee',145,'A smooth combination of espresso, steamed milk, and sweet vanilla flavor.'],
        ['Mocha','Coffee',150,'A delightful combination of espresso, chocolate, and steamed milk.'],
        ['Flat White','Coffee',135,'A rich espresso drink combined with velvety steamed milk for a balanced coffee flavor.'],
        ['Macchiato','Coffee',110,'A bold espresso topped with a small amount of steamed milk or milk foam.'],
        ['Spanish Latte','Coffee',155,'A creamy espresso-based drink combined with milk and condensed milk.'],
        ['Iced Americano','Iced Coffee',105,'A refreshing combination of espresso, cold water, and ice.'],
        ['Iced Caramel Latte','Iced Coffee',155,'A chilled espresso latte mixed with creamy milk, sweet caramel syrup, and ice.'],
        ['Cold Brew','Iced Coffee',140,'Smooth coffee slowly steeped in cold water for a naturally rich flavor and refreshing finish.'],
        ['Iced Chocolate','Non-Coffee',125,'A delicious chocolate drink blended with creamy milk and served cold over ice.'],
        ['Strawberry Milk','Non-Coffee',125,'A sweet and refreshing milk-based drink with delicious strawberry flavor.'],
        ['Matcha Latte','Non-Coffee',145,'A smooth combination of matcha green tea and creamy steamed milk.'],
        ['Iced Matcha Latte','Non-Coffee',150,'A refreshing chilled matcha drink blended with milk and served over ice.'],
        ['Classic Milk Tea','Tea',120,'A classic black tea blended with creamy milk for a smooth and satisfying beverage.'],
        ['Peach Iced Tea','Tea',95,'A refreshing iced tea infused with sweet peach flavor.'],
        ['Lemon Tea','Tea',90,'A refreshing tea with a bright citrus flavor and a light finish.'],
        ['Butter Croissant','Pastries',75,'A freshly baked pastry with a golden, flaky exterior and a soft, buttery interior.'],
        ['Chocolate Muffin','Pastries',85,'A soft and moist chocolate muffin filled with delicious chocolate flavor.'],
        ['Blueberry Cheesecake','Pastries',145,'A creamy cheesecake with a smooth texture and a sweet blueberry topping.'],
        ['Cinnamon Roll','Pastries',95,'A soft, freshly baked roll filled with cinnamon sugar and finished with a sweet glaze.'],
        ['Chocolate Brownie','Pastries',80,'A rich and fudgy chocolate dessert with a soft center.'],
        ['Garlic Bread','Snacks',75,'Toasted bread topped with flavorful garlic butter, offering a crispy texture and savory taste.'],
        ['Ham and Cheese Sandwich','Snacks',120,'A satisfying sandwich filled with savory ham and melted cheese between slices of toasted bread.'],
        ['French Fries','Snacks',90,'Crispy golden potato fries served hot, perfect as a light snack.']
    ];
    const existingProducts = await getAllRecords('Products');
    for (const [name, category, price, description] of menuProducts) {
        const existing = existingProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            const changed = { ...existing, categoryId: categoryIdByName[category.toLowerCase()], description: existing.description || description };
            if (existing.stock === undefined) changed.stock = 100;
            if (existing.image === undefined) changed.image = '';
            await updateRecord('Products', changed);
        } else {
            await addRecord('Products', {
                productId: generateId('PROD'), name, categoryId: categoryIdByName[category.toLowerCase()],
                price, description, image: '', stock: 100, availability: true
            });
        }
    }

    // Update existing Admin account credentials when present; create defaults only for fresh installs.
    const users = await getAllRecords('Users');
    const targetAdminUsername = 'ARL@COFFEESHOP.COM';
    const targetAdminEmail = 'ARL@COFFEESHOP.COM';
    const targetAdminPassword = 'ADMIN123';

    if (users.length === 0) {
        const adminPass = await hashPassword(targetAdminPassword);
        await addRecord('Users', {
            userId: generateId('USR'),
            fullName: 'System Administrator',
            username: targetAdminUsername,
            email: targetAdminEmail,
            contactNumber: '0000000000',
            passwordHash: adminPass.hash,
            passwordSalt: adminPass.salt,
            role: 'Administrator',
            accountStatus: 'Active',
            dateRegistered: new Date().toISOString()
        });

        const cashierPass = await hashPassword('cashier123');
        await addRecord('Users', {
            userId: generateId('USR'),
            fullName: 'Default Cashier',
            username: 'cashier',
            email: 'cashier@coffeeshop.com',
            contactNumber: '0000000001',
            passwordHash: cashierPass.hash,
            passwordSalt: cashierPass.salt,
            role: 'Cashier',
            accountStatus: 'Active',
            dateRegistered: new Date().toISOString()
        });
    }

    // Migrate/update the existing Admin account in place. Never create duplicate Admin accounts.
    const currentUsers = await getAllRecords('Users');
    const adminUsers = currentUsers.filter(u => u.role === 'Administrator' || u.role === 'Admin');
    if (adminUsers.length > 0) {
        const primaryAdmin = adminUsers.find(u => (u.username || '').toLowerCase() === 'admin')
            || adminUsers.find(u => (u.email || '').toLowerCase() === targetAdminEmail.toLowerCase())
            || adminUsers[0];
        const conflict = currentUsers.find(u => u.userId !== primaryAdmin.userId && (
            (u.username || '').toLowerCase() === targetAdminUsername.toLowerCase() ||
            (u.email || '').toLowerCase() === targetAdminEmail.toLowerCase()
        ));
        if (!conflict) {
            const credentials = await hashPassword(targetAdminPassword);
            const updatedAdmin = {
                ...primaryAdmin,
                username: targetAdminUsername,
                email: targetAdminEmail,
                passwordHash: credentials.hash,
                passwordSalt: credentials.salt,
                role: 'Administrator',
                accountStatus: 'Active'
            };
            await updateRecord('Users', updatedAdmin);

            // Keep the current browser session aligned with the updated Admin account.
            try {
                ['userSession'].forEach(key => {
                    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
                    if (!raw) return;
                    const session = JSON.parse(raw);
                    if (session && session.userId === updatedAdmin.userId) {
                        const next = {
                            ...session,
                            fullName: updatedAdmin.fullName,
                            username: updatedAdmin.username,
                            email: updatedAdmin.email,
                            role: updatedAdmin.role,
                            accountStatus: updatedAdmin.accountStatus
                        };
                        if (localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(next));
                        if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(next));
                    }
                });
            } catch (e) {
                console.warn('Admin session refresh skipped:', e);
            }
        } else {
            console.warn('Admin credential update skipped due to username/email conflict:', conflict.userId);
        }
    } else {
        const usernameTaken = currentUsers.some(u => (u.username || '').toLowerCase() === targetAdminUsername.toLowerCase());
        const emailTaken = currentUsers.some(u => (u.email || '').toLowerCase() === targetAdminEmail.toLowerCase());
        if (!usernameTaken && !emailTaken) {
            const credentials = await hashPassword(targetAdminPassword);
            await addRecord('Users', {
                userId: generateId('USR'), fullName: 'System Administrator', username: targetAdminUsername,
                email: targetAdminEmail, contactNumber: '0000000000',
                passwordHash: credentials.hash, passwordSalt: credentials.salt,
                role: 'Administrator', accountStatus: 'Active', dateRegistered: new Date().toISOString()
            });
        }
    }

    // Add default settings
    const settings = await getAllRecords('Settings');
    if (settings.length === 0) {
        await addRecord('Settings', { key: 'shopName', value: 'ARL Coffee Shop' });
        await addRecord('Settings', { key: 'taxRate', value: 12 });
        await addRecord('Settings', { key: 'currency', value: 'PHP' });
    }
    
    // Add sample inventory
    const inventory = await getAllRecords('Inventory');
    if (inventory.length === 0) {
        await addRecord('Inventory', { 
            ingredientId: generateId('ING'), 
            name: 'Coffee Beans', 
            quantity: 5000, 
            unit: 'grams', 
            minimumStock: 1000,
            cost: 0.05
        });
        await addRecord('Inventory', { 
            ingredientId: generateId('ING'), 
            name: 'Milk', 
            quantity: 10000, 
            unit: 'ml', 
            minimumStock: 2000,
            cost: 0.08
        });
        await addRecord('Inventory', { 
            ingredientId: generateId('ING'), 
            name: 'Sugar', 
            quantity: 2000, 
            unit: 'grams', 
            minimumStock: 500,
            cost: 0.02
        });
    }
}

// Export functions
window.DB = {
    initDB,
    addRecord,
    getRecord,
    getAllRecords,
    updateRecord,
    deleteRecord,
    getByIndex,
    generateId,
    hashPassword,
    verifyPassword,
    initializeSampleData
};
