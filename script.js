'use strict';
const $=id=>document.getElementById(id);
const money=n=>n==null?'ยังไม่สามารถระบุได้':new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(n);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={rent:'ค่าเช่า',service:'ค่าบริการ',work:'ค่าจ้างทำของ',advertising:'ค่าโฆษณา',freight:'ค่าขนส่งสินค้า',goods:'ค่าซื้อสินค้า',hotel:'ค่าที่พักโรงแรม',restaurant:'ค่าอาหารภัตตาคาร',other:'อื่น ๆ'};
function round(n){return Math.round((n+Number.EPSILON)*100)/100}
function analyze(x){
 const questions=[];const amount=Number(x.amount);
 const required={payerCountry:'ประเทศผู้จ่ายเงิน',recipientCountry:'ประเทศผู้รับเงิน',paymentDate:'วันที่จ่ายเงิน',incomeType:'ประเภทเงินได้',vatStatus:'สถานะ VAT',payerStatus:'สถานะผู้จ่ายเงิน',recipientStatus:'สถานะผู้รับเงิน'};
 for(const [key,label] of Object.entries(required))if(!String(x[key]||'').trim())questions.push('กรุณาระบุ'+label);
 if(!Number.isFinite(amount)||amount<=0)questions.push('กรุณาระบุจำนวนเงินมากกว่า 0');
 if(x.incomeType!=='freight'&&!String(x.description||'').trim())questions.push('กรุณาระบุรายละเอียดงานหรือสัญญา');
 if(x.payerStatus!=='company')questions.push('ต้องยืนยันหน้าที่หักภาษีของผู้จ่ายเงิน: กฎนี้รองรับเฉพาะนิติบุคคล');
 if(!['person','company'].includes(x.recipientStatus))questions.push('ต้องยืนยันสถานะผู้รับเงิน');
 if(x.payerCountry!=='ไทย'||x.recipientCountry!=='ไทย')questions.push('ต้องตรวจสอบกรณีต่างประเทศและอนุสัญญาภาษีซ้อน');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(x.paymentDate||'')||x.paymentDate<'2001-09-15')questions.push('วันที่จ่ายเงินไม่อยู่ในช่วงที่กฎค่าขนส่งฉบับนี้ยืนยันได้');
 const rule=window.TAX_RULES.find(r=>r.type===x.incomeType);
 if(!rule)questions.push('ยังไม่มีกฎที่ตรวจสอบได้สำหรับรายการนี้');
 if(x.incomeType!=='freight')questions.push('รายการนี้ยังต้องตรวจสอบลักษณะธุรกรรมและข้อยกเว้นเพิ่มเติม');
 if(x.incomeType==='freight'){
  const detail=(x.description+' '+x.special+' '+x.businessInfo).toLowerCase();
  if(/ค่าโดยสาร|ผู้โดยสาร|ขนส่งสาธารณะ|รถโดยสาร|รถประจำทาง/.test(detail))questions.push('รายการอาจเป็นค่าโดยสารขนส่งสาธารณะ ซึ่งไม่อยู่ในกฎค่าขนส่งสินค้า 1%');
  if(/ติดตั้ง|คลังสินค้า|เก็บสินค้า|ขนถ่าย|ยกตู้|handling|แพ็ค|บรรจุ|พิธีการ|ค่าบริการอื่น|เหมารวม|รวมบริการ|สัญญาผสม|จัดส่งพร้อมสินค้า|ขายสินค้า|ซื้อสินค้า/.test(detail))questions.push('พบลักษณะบริการผสมหรือค่าขนส่งรวมกับรายการอื่น ต้องแยกประเภทและฐานภาษีก่อน');
  if(amount<1000)questions.push('จำนวนเงินต่ำกว่า 1,000 บาท ต้องยืนยันยอดตามสัญญารายหนึ่ง ๆ ก่อน');
  if(x.freightConfirmed!=='yes')questions.push('โปรดยืนยันว่าเป็นค่ารับขนสินค้าโดยเฉพาะ ไม่ใช่ค่าโดยสารหรือบริการผสม');
 }
 let vat=null;
 if(x.vatStatus==='none')vat=0;
 else if(x.vatStatus==='7'&&x.paymentDate<='2027-09-30')vat=round(amount*.07);
 else if(x.vatStatus==='7')questions.push('ต้องยืนยันอัตรา VAT ที่มีผล ณ วันที่จ่าย');
 else questions.push('ไม่ทราบ VAT: แสดงยอดหัก ณ ที่จ่ายได้หากเข้าเงื่อนไข แต่ยังสรุปยอดจ่ายสุทธิไม่ได้');
 const eligible=x.incomeType==='freight'&&questions.filter(q=>!q.startsWith('ไม่ทราบ VAT:')).length===0;
 const rate=eligible?1:null,withholding=eligible?round(amount*.01):null;
 const net=eligible&&vat!==null?round(amount+vat-withholding):null;
 const form=eligible?(x.recipientStatus==='person'?'ภ.ง.ด.3':'ภ.ง.ด.53'):null;
 return {status:eligible?'calculated':'pending',type:names[x.incomeType]||'ไม่ระบุ',amount:Number.isFinite(amount)&&amount>0?amount:null,vat,rate,withholding,net,form,rule,questions:[...new Set(questions)],note:eligible?'คำนวณตามกฎค่าขนส่งสินค้า ท.ป.4/2528 ข้อ 12/4 ภายใต้ข้อมูลที่ระบุ โปรดตรวจสอบเอกสารจริงก่อนใช้งาน':'ระบบไม่คาดเดาอัตราเมื่อเงื่อนไขยังไม่ครบ'};
}
function render(r){updateSummary(r);switchPanel('calculator');const result=$('result');result.hidden=false;
 const metrics=[['จำนวนเงินก่อน VAT',money(r.amount)],['VAT',money(r.vat)],['อัตราหัก ณ ที่จ่าย',r.rate===null?'ต้องตรวจสอบ':r.rate+'%'],['ภาษีหัก ณ ที่จ่าย',money(r.withholding)],['ยอดจ่ายสุทธิ',money(r.net)],['แบบนำส่ง',r.form||'ต้องตรวจสอบ']];
 result.innerHTML=`<h2>ผลการวิเคราะห์</h2><div class="status ${r.status==='calculated'?'success':'pending'}">${r.status==='calculated'?'คำนวณตามกฎที่เข้าเงื่อนไข':'ต้องการข้อมูลเพิ่มเติม / ตรวจสอบกฎหมาย'}</div><p><strong>ประเภทเงินได้:</strong> ${escapeHtml(r.type)}</p><div class="metrics">${metrics.map(([a,b])=>`<div class="metric"><small>${a}</small><strong>${b}</strong></div>`).join('')}</div>${r.questions.length?`<h3>ข้อมูลที่ต้องตรวจสอบ</h3><ul>${r.questions.map(q=>`<li>${escapeHtml(q)}</li>`).join('')}</ul>`:''}<p>${escapeHtml(r.note)}</p>${r.rule?`<p><strong>กฎตัวอย่าง:</strong> ${escapeHtml(r.rule.id)} · อัตราเบื้องต้น ${r.rule.rate}% (ตรวจสอบอัตรากฎหมายทั่วไปแล้ว แต่ยังไม่ยืนยันการใช้กับธุรกรรมนี้)</p><p><strong>เงื่อนไข:</strong> ${escapeHtml(r.rule.conditions)}</p><p><a href="${r.rule.source}" target="_blank" rel="noopener">เปิดแหล่งอ้างอิงกรมสรรพากร</a></p>`:''}<div class="actions"><button type="button" id="copyResult" class="secondary">คัดลอกผลการวิเคราะห์</button><button type="button" id="printResult" class="secondary">พิมพ์ผลลัพธ์</button></div>`;
 $('copyResult').addEventListener('click',async()=>{const t=result.innerText;try{await navigator.clipboard.writeText(t);$('copyResult').textContent='คัดลอกแล้ว'}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();$('copyResult').textContent=ok?'คัดลอกแล้ว':'ไม่สามารถคัดลอกได้'}});
 $('printResult').addEventListener('click',()=>window.print());result.scrollIntoView({behavior:'smooth',block:'start'});
}
$('taxForm').addEventListener('submit',e=>{e.preventDefault();const x=Object.fromEntries(['payerName','payerStatus','payerCountry','recipientName','recipientStatus','recipientCountry','businessInfo','incomeType','amount','vatStatus','paymentDate','description','special'].map(k=>[k,$(k).value.trim()]));x.freightConfirmed=$('freightConfirmed').checked?'yes':'no';render(analyze(x))});
$('taxForm').addEventListener('reset',()=>{$('result').hidden=true;$('result').innerHTML='';setTimeout(()=>{$('payerCountry').value='ไทย';$('recipientCountry').value='ไทย'},0)});
// Export pure engine for local test runner.
window.TaxEngine={analyze,round};

function switchPanel(id){document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('active',el.id===id));document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchPanel(b.dataset.tab)));
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>switchPanel(b.dataset.next)));
$('viewDetails').addEventListener('click',()=>switchPanel('payer'));
$('showRules').addEventListener('click',()=>switchPanel('rules'));
function updateSummary(r){const put=(id,v)=>$(id).textContent=v;put('sAmount',money(r.amount));put('sVat',money(r.vat));put('sWht',money(r.withholding));put('sNet',money(r.net));put('sumAmount',money(r.amount));put('sumVat',money(r.vat));put('sumBase',money(r.amount));put('sumWht',money(r.withholding));put('sumNet',money(r.net));put('summaryStatus',r.status==='calculated'?'คำนวณตามกฎแล้ว':'ต้องตรวจสอบเพิ่มเติม');}
$('taxForm').addEventListener('reset',()=>{['sAmount','sVat','sWht','sNet','sumAmount','sumVat','sumBase'].forEach(id=>$(id).textContent='—');$('sumWht').textContent='ต้องตรวจสอบ';$('sumNet').textContent='ต้องตรวจสอบ';$('summaryStatus').textContent='รอข้อมูลธุรกรรม';switchPanel('dashboard')});
