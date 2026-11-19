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
 if(!String(x.description||'').trim() && !(x.incomeType==='freight' && x.freightConfirmed==='yes') && !(['rent','service','work','advertising'].includes(x.incomeType) && x.transactionConfirmed==='yes'))questions.push('กรุณาระบุรายละเอียดงานหรือสัญญา เช่น ค่าเช่าสำนักงาน หรือค่าขนส่งสินค้าตามสัญญา');
 if(x.payerStatus!=='company')questions.push('ต้องยืนยันหน้าที่หักภาษีของผู้จ่ายเงิน: กฎนี้รองรับเฉพาะนิติบุคคล');
 if(!['person','company'].includes(x.recipientStatus))questions.push('ต้องยืนยันสถานะผู้รับเงิน');
 if(x.payerCountry!=='ไทย'||x.recipientCountry!=='ไทย')questions.push('ต้องตรวจสอบกรณีต่างประเทศและอนุสัญญาภาษีซ้อน');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(x.paymentDate||'')||x.paymentDate<'2001-09-15')questions.push('กรุณาระบุวันที่จ่ายเงินที่ถูกต้อง (ตั้งแต่ 15 กันยายน 2544)');
 const rule=(Array.isArray(window.TAX_RULES)?window.TAX_RULES:[]).find(r=>r.type===x.incomeType);
 if(!rule)questions.push('ยังไม่มีกฎที่ตรวจสอบได้สำหรับรายการนี้');
 if(['rent','service','work','advertising'].includes(x.incomeType)){
  if(x.transactionConfirmed!=='yes')questions.push('กรุณาติ๊กช่องยืนยันประเภทเงินได้และข้อยกเว้นในหน้ารายละเอียดธุรกรรม');
  const detail=((x.description||'')+' '+(x.special||'')).toLowerCase();
  if(/ไม่แน่ใจ|ไม่ทราบ|สัญญาผสม|เหมารวม|รวมบริการ|ต่างประเทศ/.test(detail))questions.push('รายละเอียดอาจมีเงื่อนไขซับซ้อน ต้องตรวจสอบสัญญาเพิ่มเติม');
 }
 if(['goods','hotel','restaurant','other'].includes(x.incomeType))questions.push('รายการนี้ต้องตรวจสอบลักษณะธุรกรรมและข้อยกเว้นเพิ่มเติม ไม่สามารถสรุปอัตราอัตโนมัติ');
 if(x.incomeType==='freight'){
  const detail=((x.description||'')+' '+(x.special||'')+' '+(x.businessInfo||'')).toLowerCase();
  if(/ค่าโดยสาร|ผู้โดยสาร|ขนส่งสาธารณะ|รถโดยสาร|รถประจำทาง/.test(detail))questions.push('รายการอาจเป็นค่าโดยสารขนส่งสาธารณะ ซึ่งไม่อยู่ในกฎค่าขนส่งสินค้า 1%');
  if(/ติดตั้ง|ค่าฝากเก็บ|ค่าจัดเก็บ|ค่าบริการคลังสินค้า|ขนถ่าย|ยกตู้|handling|แพ็ค|บรรจุ|พิธีการ|ค่าบริการอื่น|เหมารวม|รวมบริการ|สัญญาผสม|จัดส่งพร้อมสินค้า|ค่าขายสินค้า|ค่าซื้อสินค้า/.test(detail))questions.push('พบลักษณะบริการผสมหรือค่าขนส่งรวมกับรายการอื่น ต้องแยกประเภทและฐานภาษีก่อน');
  if(amount<1000)questions.push('จำนวนเงินต่ำกว่า 1,000 บาท ต้องยืนยันยอดตามสัญญารายหนึ่ง ๆ ก่อน');
  if(x.freightConfirmed!=='yes')questions.push('โปรดยืนยันว่าเป็นค่ารับขนสินค้าโดยเฉพาะ ไม่ใช่ค่าโดยสารหรือบริการผสม');
 }
 let vat=null;
 if(x.vatStatus==='none')vat=0;
 else if(x.vatStatus==='7'&&x.paymentDate<='2027-09-30')vat=round(amount*.07);
 else if(x.vatStatus==='7')questions.push('ต้องยืนยันอัตรา VAT ที่มีผล ณ วันที่จ่าย');
 else questions.push('ไม่ทราบ VAT: แสดงยอดหัก ณ ที่จ่ายได้หากเข้าเงื่อนไข แต่ยังสรุปยอดจ่ายสุทธิไม่ได้');
 const eligible=Boolean(rule)&&['rent','service','work','advertising','freight'].includes(x.incomeType)&&questions.filter(q=>!q.startsWith('ไม่ทราบ VAT:')).length===0;
 const rate=eligible?rule.rate:null,withholding=eligible?round(amount*rate/100):null;
 const net=eligible&&vat!==null?round(amount+vat-withholding):null;
 const form=eligible?(x.recipientStatus==='person'?'ภ.ง.ด.3':'ภ.ง.ด.53'):null;
 return {status:eligible?'calculated':'pending',type:names[x.incomeType]||'ไม่ระบุ',amount:Number.isFinite(amount)&&amount>0?amount:null,vat,rate,withholding,net,form,rule,questions:[...new Set(questions)],note:eligible?'คำนวณตามอัตราเบื้องต้นของกฎ '+rule.id+' จากข้อมูลและคำยืนยันของผู้กรอก โปรดตรวจสอบสัญญาและข้อกฎหมายก่อนใช้งานจริง':'ระบบไม่คาดเดาอัตราเมื่อเงื่อนไขยังไม่ครบ'};
}
function render(r){updateSummary(r);switchPanel('calculator');const result=$('result');result.hidden=false;
 const missingStatus=r.questions.some(q=>q.includes('สถานะผู้จ่ายเงิน')||q.includes('สถานะผู้รับเงิน')||q.includes('หน้าที่หักภาษีของผู้จ่ายเงิน'));
 const metrics=[['จำนวนเงินก่อน VAT',money(r.amount)],['VAT',money(r.vat)],['อัตราหัก ณ ที่จ่าย',r.rate===null?'ต้องตรวจสอบ':r.rate+'%'],['ภาษีหัก ณ ที่จ่าย',money(r.withholding)],['ยอดจ่ายสุทธิ',money(r.net)],['แบบนำส่ง',r.form||'ต้องตรวจสอบ']];
 result.innerHTML=`<h2>ผลการวิเคราะห์</h2><div class="status ${r.status==='calculated'?'success':'pending'}">${r.status==='calculated'?'คำนวณตามกฎที่เข้าเงื่อนไข':'ต้องการข้อมูลเพิ่มเติม / ตรวจสอบกฎหมาย'}</div><p><strong>ประเภทเงินได้:</strong> ${escapeHtml(r.type)}</p><div class="metrics">${metrics.map(([a,b])=>`<div class="metric"><small>${a}</small><strong>${b}</strong></div>`).join('')}</div>${missingStatus?`<div class="status pending">โปรดเลือกสถานะผู้จ่ายเงินและผู้รับเงินในแบบฟอร์มก่อนคำนวณ <button type="button" id="fixPayerStatus">ไปที่ข้อมูลผู้จ่ายเงิน</button></div>`:''}${r.questions.length?`<h3>ข้อมูลที่ต้องตรวจสอบ</h3><ul>${r.questions.map(q=>`<li>${escapeHtml(q)}</li>`).join('')}</ul>`:''}<p>${escapeHtml(r.note)}</p>${r.rule?`<p><strong>กฎตัวอย่าง:</strong> ${escapeHtml(r.rule.id)} · อัตราเบื้องต้น ${r.rule.rate}% (ตรวจสอบอัตรากฎหมายทั่วไปแล้ว แต่ยังไม่ยืนยันการใช้กับธุรกรรมนี้)</p><p><strong>เงื่อนไข:</strong> ${escapeHtml(r.rule.conditions)}</p><p><a href="${r.rule.source}" target="_blank" rel="noopener">เปิดแหล่งอ้างอิงกรมสรรพากร</a></p>`:''}<div class="actions"><button type="button" id="saveResult" class="full-btn">บันทึกรายการนี้</button><button type="button" id="copyResult" class="secondary">คัดลอกผลการวิเคราะห์</button><button type="button" id="printResult" class="secondary">พิมพ์ผลลัพธ์</button></div>`;
 if($('fixPayerStatus'))$('fixPayerStatus').addEventListener('click',()=>{switchPanel('payer');$('payerStatus').focus()});
 $('saveResult').addEventListener('click',saveCurrentResult);
 $('copyResult').addEventListener('click',async()=>{const t=result.innerText;try{await navigator.clipboard.writeText(t);$('copyResult').textContent='คัดลอกแล้ว'}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();$('copyResult').textContent=ok?'คัดลอกแล้ว':'ไม่สามารถคัดลอกได้'}});
 $('printResult').addEventListener('click',()=>window.print());result.scrollIntoView({behavior:'smooth',block:'start'});
}
function runTaxAnalysis(){
 const feedback=$('analysisFeedback');
 if(feedback){feedback.hidden=false;feedback.textContent='กำลังวิเคราะห์ข้อมูล…';}
 try {
  const x=collectInput();
  for(const id of ['payerStatus','recipientStatus']){const el=$(id);el.style.outline=el.value?'':'2px solid #d97706';el.addEventListener('change',()=>{el.style.outline=''}, {once:true});}
  if(!Array.isArray(window.TAX_RULES))throw new Error('โหลดกฎภาษีไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ');
  currentInput=x;
  currentResult=analyze(x);
  render(currentResult);
  if(feedback){feedback.hidden=true;feedback.textContent='';}
 } catch(error) {
  console.error('Tax analysis error:',error);
  switchPanel('calculator');
  const result=$('result');
  result.hidden=false;
  const message='ไม่สามารถวิเคราะห์ได้: '+(error?.message||'เกิดข้อผิดพลาด กรุณาตรวจสอบข้อมูล');
  result.textContent=message;
  if(feedback){feedback.hidden=false;feedback.textContent=message;}
 }
}
function updateTransactionConfirmations(){
 const type=$('incomeType').value;
 const general=['rent','service','work','advertising'].includes(type);
 const freight=type==='freight';
 const generalLabel=$('transactionConfirmed').closest('label');
 const freightLabel=$('freightConfirmed').closest('label');
 generalLabel.hidden=!general;generalLabel.style.display=general?'flex':'none';
 freightLabel.hidden=!freight;freightLabel.style.display=freight?'flex':'none';
}
$('incomeType').addEventListener('change',updateTransactionConfirmations);
updateTransactionConfirmations();
$('taxForm').addEventListener('submit',e=>{e.preventDefault();runTaxAnalysis()});
// Direct click handler: does not depend on browser form submission.
$('analyzeButton').addEventListener('click',e=>{e.preventDefault();runTaxAnalysis()});

$('taxForm').addEventListener('reset',()=>{setTimeout(updateTransactionConfirmations,0);$('result').hidden=true;$('result').innerHTML='';setTimeout(()=>{$('payerCountry').value='ไทย';$('recipientCountry').value='ไทย'},0)});
// Export pure engine for local test runner.
window.TaxEngine={analyze,round};

function switchPanel(id){document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('active',el.id===id));document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchPanel(b.dataset.tab)));
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>switchPanel(b.dataset.next)));
$('viewDetails').addEventListener('click',()=>switchPanel('payer'));
$('showRules').addEventListener('click',()=>switchPanel('rules'));
function updateSummary(r){const put=(id,v)=>$(id).textContent=v;put('sAmount',money(r.amount));put('sVat',money(r.vat));put('sWht',money(r.withholding));put('sNet',money(r.net));put('sumAmount',money(r.amount));put('sumVat',money(r.vat));put('sumBase',money(r.amount));put('sumWht',money(r.withholding));put('sumNet',money(r.net));put('summaryStatus',r.status==='calculated'?'คำนวณตามกฎแล้ว':'ต้องตรวจสอบเพิ่มเติม');}
$('taxForm').addEventListener('reset',()=>{['sAmount','sVat','sWht','sNet','sumAmount','sumVat','sumBase'].forEach(id=>$(id).textContent='—');$('sumWht').textContent='ต้องตรวจสอบ';$('sumNet').textContent='ต้องตรวจสอบ';$('summaryStatus').textContent='รอข้อมูลธุรกรรม';switchPanel('dashboard')});


// History is local-only. No account, cloud sync, or automatic sharing.
const HISTORY_KEY='ai_wht_history_v1';
let currentInput=null,currentResult=null,editingHistoryId=null;
const fields=['payerName','payerStatus','payerCountry','recipientName','recipientStatus','recipientCountry','businessInfo','incomeType','amount','vatStatus','paymentDate','description','special'];
function readHistory(){try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function writeHistory(items){localStorage.setItem(HISTORY_KEY,JSON.stringify(items));showHistory()}
function collectInput(){const x=Object.fromEntries(fields.map(k=>[k,$(k).value.trim()]));x.freightConfirmed=$('freightConfirmed').checked?'yes':'no';x.transactionConfirmed=$('transactionConfirmed').checked?'yes':'no';return x}
function saveCurrentResult(){
 if(!currentInput||!currentResult){alert('กรุณาวิเคราะห์ภาษีก่อนบันทึก');return}
 const items=readHistory(),now=new Date().toISOString();
 const id=editingHistoryId||((typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'entry-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 const existing=items.findIndex(item=>item.id===id);
 const record={id,createdAt:existing>=0?items[existing].createdAt:now,updatedAt:now,input:currentInput,result:{status:currentResult.status,type:currentResult.type,amount:currentResult.amount,vat:currentResult.vat,rate:currentResult.rate,withholding:currentResult.withholding,net:currentResult.net,form:currentResult.form,questions:currentResult.questions,note:currentResult.note,ruleId:currentResult.rule?.id||null}};
 if(existing>=0)items[existing]=record;else items.unshift(record);
 try{writeHistory(items);editingHistoryId=null;$('saveResult').textContent='บันทึกเรียบร้อย ✓';setTimeout(()=>{const b=$('saveResult');if(b)b.textContent='บันทึกรายการนี้'},1800)}catch(err){alert('ไม่สามารถบันทึกได้ พื้นที่เก็บข้อมูลเบราว์เซอร์อาจเต็มหรือถูกปิดใช้งาน')}
}
function showHistory(){
 const items=readHistory();if($('historyCount'))$('historyCount').textContent=String(items.length);
 const q=($('historySearch').value||'').trim().toLocaleLowerCase();
 const filtered=items.filter(item=>[item.input?.payerName,item.input?.recipientName,item.result?.type,item.input?.paymentDate].some(v=>String(v||'').toLocaleLowerCase().includes(q)));
 $('historyList').innerHTML=filtered.length?filtered.map(item=>`<article class="history-item"><div><strong>${escapeHtml(item.result?.type||'ไม่ระบุ')}</strong><small>วันที่จ่าย ${escapeHtml(item.input?.paymentDate||'-')} · บันทึก ${escapeHtml(new Date(item.createdAt).toLocaleString('th-TH'))}</small><p>${escapeHtml(item.input?.payerName||'-')} → ${escapeHtml(item.input?.recipientName||'-')}</p><p>ยอดก่อน VAT: ${money(item.result?.amount)} · ภาษีหัก ณ ที่จ่าย: ${money(item.result?.withholding)} · ${item.result?.status==='calculated'?'คำนวณตามกฎ':'รอตรวจสอบ'}</p></div><div class="history-actions"><button type="button" class="outline" data-action="view" data-id="${escapeHtml(item.id)}">ดูผล</button><button type="button" class="outline" data-action="edit" data-id="${escapeHtml(item.id)}">แก้ไข</button><button type="button" class="outline" data-action="delete" data-id="${escapeHtml(item.id)}">ลบ</button></div></article>`).join(''):'<p>ยังไม่มีรายการที่ตรงกับการค้นหา</p>';
}
$('historySearch').addEventListener('input',showHistory);
$('historyList').addEventListener('click',e=>{
 const button=e.target.closest('button[data-action]');if(!button)return;
 const item=readHistory().find(x=>x.id===button.dataset.id);if(!item)return;
 if(button.dataset.action==='delete'){if(confirm('ต้องการลบรายการนี้อย่างถาวรจากเบราว์เซอร์นี้หรือไม่?')){try{writeHistory(readHistory().filter(x=>x.id!==item.id))}catch{alert('ลบข้อมูลไม่สำเร็จ')}}return}
 if(button.dataset.action==='view'){
  currentInput=item.input;currentResult=analyze(item.input);editingHistoryId=item.id;
  render(currentResult);return;
 }
 if(button.dataset.action==='edit'){
  fields.forEach(k=>{if($(k))$(k).value=item.input?.[k]||''});$('freightConfirmed').checked=item.input?.freightConfirmed==='yes';$('transactionConfirmed').checked=item.input?.transactionConfirmed==='yes';
  editingHistoryId=item.id;currentInput=null;currentResult=null;$('result').hidden=true;
  switchPanel('payer');alert('โหลดข้อมูลแล้ว กรุณาตรวจสอบและกดวิเคราะห์ภาษีอีกครั้ง จากนั้นกดบันทึกเพื่ออัปเดตรายการเดิม');
 }
});
$('exportHistory').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({format:'ai-wht-history',version:1,exportedAt:new Date().toISOString(),records:readHistory()},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tax-history-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('importHistory').addEventListener('click',()=>$('importHistoryFile').click());
$('importHistoryFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{if(file.size>5_000_000)throw Error('ไฟล์ใหญ่เกิน 5 MB');const data=JSON.parse(await file.text());
 if(data.format!=='ai-wht-history'||!Array.isArray(data.records)||data.records.length>5000)throw Error('รูปแบบไฟล์ไม่ถูกต้อง');
 const valid=data.records.every(r=>r&&typeof r.id==='string'&&r.id.length<150&&r.input&&typeof r.input==='object'&&r.result&&typeof r.result==='object');
 if(!valid)throw Error('ข้อมูลรายการไม่ถูกต้อง');
 if(!confirm('นำเข้าข้อมูล '+data.records.length+' รายการ โดยรวมกับข้อมูลเดิม (รายการ ID ซ้ำจะใช้ข้อมูลจากไฟล์) หรือไม่?'))return;
 const map=new Map(readHistory().map(r=>[r.id,r]));for(const r of data.records)map.set(r.id,r);
 writeHistory([...map.values()]);$('historyMessage').textContent='นำเข้าสำเร็จ';
 }catch(err){$('historyMessage').textContent='นำเข้าไม่สำเร็จ: '+err.message}finally{e.target.value=''}
});
$('taxForm').addEventListener('reset',()=>{currentInput=null;currentResult=null;editingHistoryId=null});
showHistory();

// Keep the secondary history heading in sync without affecting the navigation counter.
if($('historyPageCount')){const updateHistoryHeading=()=>{$('historyPageCount').textContent=$('historyCount').textContent};updateHistoryHeading();const originalShowHistory=showHistory;showHistory=function(){originalShowHistory();updateHistoryHeading()};}
