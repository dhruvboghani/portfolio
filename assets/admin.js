const av=createAvatar($('#stage'));
const D={invoice:{t:'Invoices',api:'GET /api/invoices',cols:['Invoice','Customer','Amount','Status'],rows:[['INV-2041','Acme Traders','₹59,000','Pending'],['INV-2042','Sun Exports','₹1,24,500','Paid'],['INV-2043','Blue Ocean Co.','₹87,300','Overdue'],['INV-2044','Lotus Textiles','₹42,800','Pending']]},
vpo:{t:'Vendor purchase orders',api:'GET /api/vpo',cols:['VPO','Vendor','Quantity','Status'],rows:[['VPO-1187','Sun Mills','2,400 pcs','In production'],['VPO-1190','Lotus Textiles','1,100 pcs','Shipped'],['VPO-1194','Apex Steelware','600 sets','Confirmed']]},
packing:{t:'Packing lists',api:'GET /api/packing-lists',cols:['Packing list','VPO','Cartons','Gross weight'],rows:[['PL-5521','VPO-1190','24','1,320 kg'],['PL-5524','VPO-1187','60','3,050 kg'],['PL-5530','VPO-1194','18','940 kg']]},
container:{t:'Containers',api:'GET /api/containers',cols:['Container','Type','VPO','Status'],rows:[['MSKU4471920','40HC','VPO-1190','In transit, ETA 14 Oct'],['TGHU8830014','20GP','VPO-1187','Loading'],['CAXU2215508','40HC','VPO-1194','Booked']]},
inventory:{t:'Product inventory',api:'GET /api/inventory',cols:['SKU','Product','In stock','Location'],rows:[['TWL-01','Cotton Towels','3,420','Warehouse A'],['CKW-07','Cookware Set','210 (low)','Warehouse B'],['LED-12','LED Panel Light','1,880','Warehouse A']]},
quotation:{t:'Quotations',api:'GET /api/quotations',cols:['Quote','Customer','Value','Status'],rows:[['QT-908','Blue Ocean Co.','₹2,10,000','Sent'],['QT-911','Acme Traders','₹98,500','Approved'],['QT-914','Lotus Textiles','₹1,45,000','Draft']]},
sales:{t:'Sales this month',api:'GET /api/sales/summary?period=month',cols:['Week','Orders','Revenue'],rows:[['Week 1','9','₹3.8L'],['Week 2','12','₹5.1L'],['Week 3','11','₹4.6L'],['Week 4','10','₹4.9L']]}};
const K=[['invoice',/invoice|bill/],['vpo',/vpo|purchase order|vendor order/],['packing',/packing/],['container',/container|shipment|eta/],['inventory',/inventory|stock|sku|product/],['quotation',/quot/],['sales',/sales|revenue|sold/]];
const FW=['pending','paid','overdue','shipped','confirmed','production','transit','loading','booked','sent','approved','draft','low'];
const EX={sales:' In total that is 42 orders and 18.4 lakh rupees in revenue.',inventory:' Note that the cookware set is running low.'};
function render(k,f){const d=D[k];let rows=d.rows;if(f){const r=rows.filter(x=>x.join(' ').toLowerCase().includes(f));if(r.length)rows=r;else f=''}
 $('#trace').innerHTML=`> tool_call: ${d.api}${f?'?filter='+f:''}\n< 200 OK, <em>${rows.length} rows</em>`;
 $('#res').innerHTML=`<h4 style="font:800 20px Archivo;font-stretch:75%;text-transform:uppercase;margin:0 0 8px">${d.t}</h4><table class="tb"><tr>${d.cols.map(c=>`<th>${c}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
 return `Here ${rows.length===1?'is the':'are the'} ${rows.length} ${d.t.toLowerCase()}${f?' matching '+f:''}.`+(EX[k]&&(k==='sales'||rows.some(r=>/low/.test(r.join(' '))))?EX[k]:'')}
function brain(t){const s=t.toLowerCase();$('#yq').textContent='You asked: '+t;const m=K.find(x=>x[1].test(s));
 if(!m){$('#trace').textContent='> no tool matched this request';$('#res').innerHTML='';return{say:'I can look up invoices, vendor purchase orders, packing lists, containers, inventory, quotations and sales. Which would you like?'}}
 const f=FW.find(w=>s.includes(w))||'';return{say:render(m[0],f)}}
wireChat(av,brain,()=>{},()=>{},()=>({say:'Hello, I am your admin assistant. Ask me for invoices, purchase orders, packing lists, containers, inventory, quotations or sales.'}));
