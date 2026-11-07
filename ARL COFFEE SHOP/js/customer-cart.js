function readCart(){try{return JSON.parse(localStorage.getItem('customerCart')||'[]')}catch{return[]}}
function loadCart(){
 const cart=readCart(), box=document.getElementById('cartItems'); box.innerHTML='';
 if(!cart.length){box.innerHTML='<p class="menu-empty">Your cart is empty. <a href="customer-products.html">Browse the menu</a>.</p>';document.getElementById('subtotal').textContent='₱0.00';document.getElementById('total').textContent='₱0.00';return;}
 cart.forEach((item,i)=>{const row=document.createElement('div');row.className='cart-line';row.innerHTML=`<div><strong>${safeText(item.name)}</strong><div>₱${Number(item.price).toFixed(2)} each</div></div><div class="cart-controls"><button onclick="updateCartQuantity(${i},-1)">−</button><b>${item.quantity}</b><button onclick="updateCartQuantity(${i},1)">+</button><button class="remove-cart" onclick="removeCartItem(${i})">Remove</button></div>`;box.appendChild(row);});
 calculateCartTotal();
}
function safeText(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function updateCartQuantity(i,d){let c=readCart();if(!c[i])return;c[i].quantity+=d;if(c[i].quantity<=0)c.splice(i,1);localStorage.setItem('customerCart',JSON.stringify(c));loadCart();}
function removeCartItem(i){let c=readCart();c.splice(i,1);localStorage.setItem('customerCart',JSON.stringify(c));loadCart();}
function calculateCartTotal(){const total=readCart().reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);document.getElementById('subtotal').textContent='₱'+total.toFixed(2);document.getElementById('total').textContent='₱'+total.toFixed(2);}
function toggleTableField(){const dine=document.getElementById('orderType').value==='Dine-in';document.getElementById('tableField').style.display=dine?'block':'none';}
async function placeCustomerOrder(){
 const cart=readCart(); if(!cart.length){alert('Your cart is empty.');return;}
 const name=document.getElementById('guestName').value.trim(), phone=document.getElementById('guestPhone').value.trim();
 const type=document.getElementById('orderType').value, table=document.getElementById('tableNumber').value.trim();
 if(!name||!phone){alert('Please enter your name and contact number.');return;}
 if(!/^[0-9+()\-\s]{7,20}$/.test(phone)){alert('Please enter a valid contact number.');return;}
 if(type==='Dine-in'&&!table){alert('Please enter your table number for dine-in.');return;}
 try{
  const current=await window.DB.getAllRecords('Products');
  for(const item of cart){const p=current.find(x=>x.productId===item.productId);if(!p||p.availability===false||Number(p.stock??1)<=0)throw new Error(item.name+' is currently unavailable. Please remove it from your cart.');}
  const orderId=window.DB.generateId('ORD'), orderNumber='ARL-'+Date.now().toString().slice(-8);
  const subtotal=cart.reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0), user=window.Auth.checkAuth();
  await window.DB.addRecord('Orders',{orderId,orderNumber,customerId:user?.userId||null,userId:user?.userId||null,
   guestName:name,guestContact:phone,customerName:name,contactNumber:phone,orderType:type,tableNumber:type==='Dine-in'?table:'',
   notes:document.getElementById('orderNotes').value.trim(),date:new Date().toISOString(),subtotal,discount:0,totalAmount:subtotal,
   status:'Pending',paymentMethod:'Cash'});
  for(const item of cart)await window.DB.addRecord('OrderItems',{orderItemId:window.DB.generateId('OITM'),orderId,productId:item.productId,
   productName:item.name,quantity:Number(item.quantity),price:Number(item.price),subtotal:Number(item.price)*Number(item.quantity)});
  const history=JSON.parse(localStorage.getItem('arlGuestOrders')||'[]');history.push({orderNumber,phone});localStorage.setItem('arlGuestOrders',JSON.stringify(history));
  localStorage.removeItem('customerCart');
  alert('Order placed! Your order number is '+orderNumber+'. Keep this number to track your order.');
  location.href='customer-orders.html?order='+encodeURIComponent(orderNumber);
 }catch(e){console.error(e);alert(e.message||'Unable to place order. Please try again.');}
}
