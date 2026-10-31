// Original monoline handwriting. Every phrase is one SVG stroke path, progressively drawn.
const glyphs = {
 a:'M1 15Q-1 8 5 8Q10 8 7 15Q2 21 1 15M8 8Q6 18 12 16',
 b:'M1 16Q9 -3 5 0Q0 2 1 16Q3 6 8 9Q13 15 5 18Q2 18 1 16L12 16',
 c:'M9 9Q3 5 1 13Q-1 22 12 16',
 d:'M8 10Q2 5 1 14Q0 21 7 16Q11 5 10 0Q7 0 7 12Q6 20 13 16',
 e:'M1 13Q11 12 8 8Q3 5 1 13Q0 22 12 16',
 f:'M1 25Q4 1 8 0Q13 1 6 9L1 12M0 12L11 11',
 g:'M9 9Q1 5 1 14Q2 22 8 15L10 9Q9 29 2 26Q-3 24 12 17',
 h:'M1 17Q11 -3 6 0Q1 1 1 17Q7 4 10 10L8 16Q9 19 14 16',
 i:'M3 9Q-1 20 8 16M5 3L5.2 3.2',
 j:'M6 9Q5 29 0 25Q-4 22 11 16M7 3L7.2 3.2',
 k:'M1 17Q10 -3 5 0Q1 4 1 17M2 12Q12 5 10 9L4 13Q8 20 13 16',
 l:'M1 15Q12 -6 6 1Q-2 16 4 18L10 16',
 m:'M1 9L0 17Q5 5 7 10L5 17Q12 5 14 10L12 16Q13 19 18 16',
 n:'M2 9L0 17Q7 4 10 10L8 16Q9 19 14 16',
 o:'M8 9Q1 5 1 14Q2 22 8 16Q13 8 8 9Q7 13 14 12',
 p:'M3 9L0 26M3 14Q8 4 11 10Q14 18 4 18L14 16',
 q:'M9 9Q1 5 1 14Q2 21 8 16L10 9L7 25L14 17',
 r:'M1 10L0 17Q3 7 5 8Q7 12 10 9M5 10Q2 21 13 16',
 s:'M9 8Q0 6 3 12Q12 17 6 18Q2 20 0 17L13 16',
 t:'M6 3Q-2 24 12 16M0 9L11 8',
 u:'M2 9Q-3 22 5 17L10 9Q6 21 14 16',
 v:'M1 9Q0 15 4 18Q12 12 9 7Q7 10 14 12',
 w:'M1 9Q-1 20 4 17L8 10Q5 21 11 17Q18 11 15 8L19 12',
 x:'M1 9Q7 14 11 18M10 8L0 18L14 16',
 y:'M2 9Q-3 22 5 17L10 9Q8 29 1 26Q-3 24 14 16',
 z:'M1 10L10 8L1 18L10 17Q6 27 1 25Q-2 23 14 16',
 ',':'M3 18L1 22', '.':'M2 18L2.2 18.2', "'":'M3 2L2 6',
};
const widths={i:7,j:8,l:9,m:18,w:18,t:10,f:10};
function handwriting(phrase) {
 let offset=5, result='';
 for(const char of phrase){
  if(char===' '){offset+=8;continue;}
  const shape=glyphs[char]; if(!shape)continue;
  result+=shape.replace(/[MQLC][^MQLC]*/g, command=>{let index=0;return command[0]+command.slice(1).replace(/-?\d*\.?\d+/g, number=>String(Number(number)+(index++%2===0?offset:6)));});
  offset+=widths[char]||13;
 }
 return {d:result,width:offset+10};
}
export function plantInkGarden(element) {
 const phrases=['love grows here','you, always','all my favourite things','a little love note','made of little moments','with love'];
 const ns='http://www.w3.org/2000/svg';
 for(const phrase of phrases){
  const {d,width}=handwriting(phrase), svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
  svg.setAttribute('viewBox',`0 0 ${width+25} 45`);svg.setAttribute('class','ink-note');
  const heart=`M${width+9} 27C${width-10} 14 ${width} 6 ${width+9} 15C${width+18} 4 ${width+29} 16 ${width+9} 27`;
  path.setAttribute('d',d+heart);path.setAttribute('pathLength','1');svg.append(path);element.append(svg);
 }
}
