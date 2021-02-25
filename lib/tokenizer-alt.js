/*
  word := LETTER+
  space := SPACE+
  macro := LETTER+ ':' LETTER+

*/
word = [
/* 00 */  ['NEXT'],
/* 01 */  ['LETTER', +4],
/* 02 */  ['ACCEPT', 'word'],
/* 02 */  ['NEXT'],
/* 03 */  ['LETTER', +1],
/* 04 */  ['JMP', -3],
/* 05 */  ['REJECT', 'word'],
];
space = [
/* 00 */  ['NEXT'],
/* 01 */  ['SPACE', +4],
/* 02 */  ['ACCEPT', 'space'],
/* 02 */  ['NEXT'],
/* 03 */  ['SPACE', +1],
/* 04 */  ['JMP', -3],
/* 05 */  ['REJECT', 'space'],
];
macro = [
/* 00 */  ['NEXT'],
/* 01 */  ['LETTER', +10],
/* 02 */  ['NEXT'],
/* 03 */  ['LETTER', +1],
/* 04 */  ['JMP', -3],
/* 06 */  ['TEST', ':', +6],
/* 07 */  ['NEXT'],
/* 08 */  ['LETTER', +4],
/* 02 */  ['ACCEPT', 'space'],
/* 09 */  ['NEXT'],
/* 10 */  ['LETTER', +1],
/* 11 */  ['JMP', -3],
/* 02 */  ['REJECT', 'space'],
];

function parse(str) {
  let program = [
    ...word,
    ...space,
    ...macro
  ];

  let i = 0;
  while(i < str.length) {
    // New token. Reset.
    const states = {};
    let pcs = [ 1, 8, 14 ];
    let candidates = 3;

    while((candidates > 0) && (i < str.length)) {

      const c = str[i];

      console.log(c);
      for(let n = 0; n < pcs.length; ++n) {

        let cont = true;
        while(cont) {
          if (pcs[n] == -1) // This thread was rejected. Ignore.
            break;

          const instr = program[pcs[n]++];
          console.log(n, pcs[n]-1, instr);
          switch(instr[0]) {
            case 'NEXT' :
              cont = false;
              break;
            case 'ACCEPT' :
              states[instr[1]] = i;
              break;
            case 'REJECT' :
              --candidates;
              states[instr[1]] = false;
              pcs[n] = -1;
              break;
            case 'JMP' :
              pcs[n] += instr[1];
              break;
            case 'LETTER' :
              if (c != 'a')
                pcs[n] += instr[1];
              break;
            case 'SPACE' :
              if (c != ' ')
                pcs[n] += instr[1];
              break;
            case 'TEST' :
              if (c != instr[1])
                pcs[n] += instr[2];
              break;
          }
        }

        ++i;
      }
      console.log(pcs);
      console.log(candidates,states);
    }
  }
}

parse("aaaa a  a:aa   aaa");
