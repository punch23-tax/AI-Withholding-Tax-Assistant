'use strict';
// Educational rule candidates. Confirm current law and exceptions before real use.
window.TAX_RULES = Object.freeze([
 {id:'RENT',type:'rent',rate:5,description:'ค่าเช่าทรัพย์สินทั่วไป',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:null,conditions:'ต้องเป็นค่าเช่าจริง ไม่ใช่บริการหรือสัญญาผสม'},
 {id:'SERVICE',type:'service',rate:3,description:'ค่าบริการทั่วไป',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:null,conditions:'ต้องเป็นบริการที่เข้าเกณฑ์ และไม่มีข้อยกเว้น'},
 {id:'WORK',type:'work',rate:3,description:'ค่าจ้างทำของ',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:null,conditions:'ตรวจสอบเนื้อหาสัญญาจ้างทำของ'},
 {id:'AD',type:'advertising',rate:2,description:'ค่าโฆษณา',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:null,conditions:'ต้องเป็นค่าโฆษณา ไม่ใช่บริการประชาสัมพันธ์ประเภทอื่น'},
 {id:'FREIGHT',type:'freight',rate:1,description:'ค่าขนส่งสินค้า',payer:'company',recipient:'domestic',form:'auto',source:'https://www.rd.go.th/3479.html',verifiedAt:null,conditions:'เฉพาะค่าขนส่งที่เข้าเงื่อนไขตามกฎหมายและไม่มีข้อยกเว้น'},
]);
