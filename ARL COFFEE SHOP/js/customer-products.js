// Customer menu: supports guest ordering and signed-in customers.
let allProducts = [];
let allCategories = [];
async function loadCustomerProducts() {
  allProducts = await window.DB.getAllRecords('Products');
  allCategories = await window.DB.getAllRecords('Categories');
  const filter = document.getElementById('categoryFilter');
  filter.innerHTML = '<option value="all">All Categories</option>';
  allCategories.forEach(c => { const o=document.createElement('option'); o.value=c.categoryId; o.textContent=c.name; filter.appendChild(o); });
  const cat = new URLSearchParams(location.search).get('cat'); if(cat) filter.value=cat;
  displayCustomerProducts(); updateCartCount();
}
function escapeHTML(v='') { return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function displayCustomerProducts() {
  const grid=document.getElementById('productsGrid'); if(!grid) return;
  const term=(document.getElementById('searchProduct')?.value||'').trim().toLowerCase();
  const cat=document.getElementById('categoryFilter')?.value||'all';
  const filtered=allProducts.filter(p=>p.availability!==false && Number(p.stock??1)>0)
    .filter(p=>cat==='all'||p.categoryId===cat)
    .filter(p=>[p.name,p.description,allCategories.find(c=>c.categoryId===p.categoryId)?.name].join(' ').toLowerCase().includes(term));
  grid.innerHTML='';
  if(!filtered.length){grid.innerHTML='<p class="menu-empty">No available products match your search.</p>';return;}
  filtered.forEach(p=>{
    const category=allCategories.find(c=>c.categoryId===p.categoryId);
    const card=document.createElement('article'); card.className='arl-product-card';
    const img=p.image ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : '';
    card.innerHTML=`<div class="arl-product-photo">${img}<span class="arl-product-placeholder" ${p.image?'style="display:none"':''}>☕</span></div>
      <div class="arl-product-info"><span class="arl-category">${escapeHTML(category?.name||'Menu')}</span>
      <h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description||'Freshly prepared at ARL Coffee Shop.')}</p>
      <div class="arl-product-bottom"><strong>₱${Number(p.price||0).toFixed(2)}</strong><button class="btn btn-primary" type="button">Add to Cart</button></div></div>`;
    card.querySelector('button').addEventListener('click',()=>addToCustomerCart(p)); grid.appendChild(card);
  });
}
function filterProducts(){displayCustomerProducts();}
function addToCustomerCart(product){
  const cart=JSON.parse(localStorage.getItem('customerCart')||'[]');
  const found=cart.find(i=>i.productId===product.productId);
  if(found) found.quantity++; else cart.push({productId:product.productId,name:product.name,price:Number(product.price),quantity:1});
  localStorage.setItem('customerCart',JSON.stringify(cart)); updateCartCount(); alert(product.name+' added to cart.');
}
function updateCartCount(){
  const count=JSON.parse(localStorage.getItem('customerCart')||'[]').reduce((s,i)=>s+Number(i.quantity||0),0);
  const el=document.getElementById('cartCount'); if(el)el.textContent=count;
}
