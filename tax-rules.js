'use strict';
// Reviewed against the linked Revenue Department consolidated order on 2026-11-20.
// Candidate rules are NOT a substitute for determining the true legal character of a payment.
window.TAX_RULES = Object.freeze([
 {id:'RENT',type:'rent',rate:5,description:'ค่าเช่าทรัพย์สินทั่วไป',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:'2026-11-20',conditions:'ต้องเป็นค่าเช่าทรัพย์สินจริง ตรวจสอบสัญญาและข้อยกเว้น'},
 {id:'SERVICE',type:'service',rate:3,description:'ค่าบริการทั่วไป',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:'2026-11-20',conditions:'ตามข้อ 12/1 เฉพาะบริการที่เข้าเกณฑ์ ไม่ใช่โรงแรม ภัตตาคาร หรือรายการยกเว้น'},
 {id:'WORK',type:'work',rate:3,description:'ค่าจ้างทำของ',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:'2026-11-20',conditions:'ตรวจสอบประเภทเงินได้และผู้รับจ้างตามข้อ 8 และข้อที่เกี่ยวข้อง'},
 {id:'AD',type:'advertising',rate:2,description:'ค่าโฆษณา',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:'2026-11-20',conditions:'ตามข้อ 10 ต้องเป็นค่าโฆษณาจริง มิใช่ค่าบริการอื่น'},
 {id:'FREIGHT',type:'freight',rate:1,description:'ค่าขนส่งสินค้า',payer:'company',recipient:'domestic',form:'auto',source:'https://rd.go.th/3291.html',verifiedAt:'2026-11-20',conditions:'ตามข้อ 12/4 ไม่รวมค่าโดยสารขนส่งสาธารณะ ต้องแยกค่าบริการอื่นจากค่าขนส่ง'},
]);
window.TAX_LEGAL_META=Object.freeze({reviewedAt:'2026-11-20',vatRate:7,vatGeneralUntil:'2027-09-30',vatSource:'https://www.rd.go.th/21221/archive/2026/english.html',electronicTemporaryRateUntil:'2025-12-31',electronicSource:'https://www.rd.go.th/3479.html'});
