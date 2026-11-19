'use strict';
const $=id=>document.getElementById(id);
const money=n=>n==null?'ยังไม่สามารถระบุได้':new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(n);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={rent:'ค่าเช่า',service:'ค่าบริการ',work:'ค่าจ้างทำของ',advertising:'ค่าโฆษณา',freight:'ค่าขนส่งสินค้า',goods:'ค่าซื้อสินค้า',hotel:'ค่าที่พักโรงแรม',restaurant:'ค่าอาหารภัตตาคาร',other:'อื่น ๆ'};
function round(n){return Math.round((n+Number.EPSILON)*100)/100}
function analyze(x){
 const questions=[];const amount=Number(x.amount);
 if(!x.payerName||!x.recipientName||!x.payerCountry||!x.recipientCountry||!x.paymentDate||!x.description||!x.incomeType||!x.vatStatus||!x.payerStatus||!x.recipientStatus||!Number.isFinite(amount)||amount<=0)questions.push('กรอกข้อมูลจำเป็นให้ครบ และระบุจำนวนเงินมากกว่า 0');
 if(x.payerStatus!=='company')questions.push('โปรดยืนยันสถานะและหน้าที่หักภาษีของผู้จ่ายเงิน (ระบบกฎตัวอย่างรองรับเฉพาะนิติบุคคล)');
 if(x.recipientStatus==='unknown')questions.push('ผู้รับเงินเป็นบุคคลธรรมดาหรือนิติบุคคล?');
 if(x.payerCountry!=='ไทย'||x.recipientCountry!=='ไทย')questions.push('ต้องตรวจสอบถิ่นที่อยู่ ภาษีข้ามประเทศ และอนุสัญญาภาษีซ้อน');
 if(x.incomeType==='other'||['goods','hotel','restaurant'].includes(x.incomeType))questions.push('รายการนี้ต้องตรวจสอบลักษณะธุรกรรมและข้อยกเว้นเพิ่มเติมก่อนสรุปอัตรา');
 if(/รวม|แยก|ติดตั้ง|สัญญาผสม|ยกเว้น|ต่างประเทศ|จัดส่ง/i.test(x.description+' '+x.special))questions.push('โปรดตรวจสอบการแยกส่วนประกอบของสัญญาและเงื่อนไขพิเศษ');
 const rule=window.TAX_RULES.find(r=>r.type===x.incomeType);
 if(!rule)questions.push('ยังไม่มีกฎที่ตรวจสอบได้สำหรับรายการนี้');
 if(rule&&rule.verifiedAt)questions.push('อัตรากฎหมายทั่วไปตรวจสอบแล้ว แต่ต้องยืนยันข้อเท็จจริงของธุรกรรมและข้อยกเว้นก่อนใช้คำนวณภาษีจริง');
 if(x.paymentDate>'2027-09-30'&&x.vatStatus==='7')questions.push('วันจ่ายเกินช่วงเวลาที่ตรวจสอบ VAT 7% ต้องตรวจสอบอัตราที่มีผลอีกครั้ง');
 if(x.paymentDate<'2026-11-20')questions.push('รายการย้อนหลังต้องตรวจสอบกฎหมายที่มีผลในวันจ่าย รวมถึงมาตรการ e-Withholding Tax ที่สิ้นสุด 31 ธันวาคม 2568');
 const vat=x.vatStatus==='7'&&x.paymentDate<='2027-09-30'?round(amount*.07):x.vatStatus==='none'?0:null;
 if(vat===null)questions.push('โปรดยืนยัน VAT เพื่อคำนวณยอดจ่ายสุทธิ');
 if(x.vatStatus==='7'&&x.paymentDate>'2027-09-30')questions.push('ไม่ยืนยัน VAT 7% สำหรับวันที่จ่ายนี้');
 // No definitive withholding result while law verification is outstanding.
 return {status:'pending',type:names[x.incomeType]||'ไม่ระบุ',amount:Number.isFinite(amount)&&amount>0?amount:null,vat,rate:null,withholding:null,net:null,form:null,rule,questions:[...new Set(questions)],note:'ระบบแสดงเพียงข้อมูลตัวเลขที่ยืนยันได้ ไม่ใช่คำวินิจฉัยภาษี'};
}
function render(r){const result=$('result');result.hidden=false;
 const metrics=[['จำนวนเงินก่อน VAT',money(r.amount)],['VAT',money(r.vat)],['อัตราหัก ณ ที่จ่าย','ต้องตรวจสอบ'],['ภาษีหัก ณ ที่จ่าย','ต้องตรวจสอบ'],['ยอดจ่ายสุทธิ','ต้องตรวจสอบ'],['แบบนำส่ง','ต้องตรวจสอบ']];
 result.innerHTML=`<h2>ผลการวิเคราะห์</h2><div class="status pending">ต้องการข้อมูลเพิ่มเติม / ตรวจสอบกฎหมาย</div><p><strong>ประเภทเงินได้:</strong> ${escapeHtml(r.type)}</p><div class="metrics">${metrics.map(([a,b])=>`<div class="metric"><small>${a}</small><strong>${b}</strong></div>`).join('')}</div><h3>ข้อมูลที่ต้องตรวจสอบ</h3><ul>${r.questions.map(q=>`<li>${escapeHtml(q)}</li>`).join('')}</ul><p>${escapeHtml(r.note)}</p>${r.rule?`<p><strong>กฎตัวอย่าง:</strong> ${escapeHtml(r.rule.id)} · อัตราเบื้องต้น ${r.rule.rate}% (ตรวจสอบอัตรากฎหมายทั่วไปแล้ว แต่ยังไม่ยืนยันการใช้กับธุรกรรมนี้)</p><p><strong>เงื่อนไข:</strong> ${escapeHtml(r.rule.conditions)}</p><p><a href="${r.rule.source}" target="_blank" rel="noopener">เปิดแหล่งอ้างอิงกรมสรรพากร</a></p>`:''}<div class="actions"><button type="button" id="copyResult" class="secondary">คัดลอกผลการวิเคราะห์</button><button type="button" id="printResult" class="secondary">พิมพ์ผลลัพธ์</button></div>`;
 $('copyResult').addEventListener('click',async()=>{const t=result.innerText;try{await navigator.clipboard.writeText(t);$('copyResult').textContent='คัดลอกแล้ว'}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();$('copyResult').textContent=ok?'คัดลอกแล้ว':'ไม่สามารถคัดลอกได้'}});
 $('printResult').addEventListener('click',()=>window.print());result.scrollIntoView({behavior:'smooth',block:'start'});
}
$('taxForm').addEventListener('submit',e=>{e.preventDefault();const x=Object.fromEntries(['payerName','payerStatus','payerCountry','recipientName','recipientStatus','recipientCountry','businessInfo','incomeType','amount','vatStatus','paymentDate','description','special'].map(k=>[k,$(k).value.trim()]));render(analyze(x))});
$('taxForm').addEventListener('reset',()=>{$('result').hidden=true;$('result').innerHTML='';setTimeout(()=>{$('payerCountry').value='ไทย';$('recipientCountry').value='ไทย'},0)});
// Export pure engine for local test runner.
window.TaxEngine={analyze,round};
