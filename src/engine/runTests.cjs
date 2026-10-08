// Node.js test runner for cubeMoves.js
// Inlines the engine code to avoid ES module issues with Node

const U = 0, R = 1, F = 2, D = 3, L = 4, B = 5;

function clone(f) { return f.slice(); }

function rotateFaceCW(f, face) {
  const b = face * 9;
  let tmp = f[b+0]; f[b+0]=f[b+6]; f[b+6]=f[b+8]; f[b+8]=f[b+2]; f[b+2]=tmp;
  tmp=f[b+1]; f[b+1]=f[b+3]; f[b+3]=f[b+7]; f[b+7]=f[b+5]; f[b+5]=tmp;
}

function moveU(src) {
  const f=clone(src); rotateFaceCW(f,U);
  const t0=f[F*9+0],t1=f[F*9+1],t2=f[F*9+2];
  f[F*9+0]=f[R*9+0];f[F*9+1]=f[R*9+1];f[F*9+2]=f[R*9+2];
  f[R*9+0]=f[B*9+0];f[R*9+1]=f[B*9+1];f[R*9+2]=f[B*9+2];
  f[B*9+0]=f[L*9+0];f[B*9+1]=f[L*9+1];f[B*9+2]=f[L*9+2];
  f[L*9+0]=t0;f[L*9+1]=t1;f[L*9+2]=t2; return f;
}
function moveD(src) {
  const f=clone(src); rotateFaceCW(f,D);
  const t0=f[F*9+6],t1=f[F*9+7],t2=f[F*9+8];
  f[F*9+6]=f[L*9+6];f[F*9+7]=f[L*9+7];f[F*9+8]=f[L*9+8];
  f[L*9+6]=f[B*9+6];f[L*9+7]=f[B*9+7];f[L*9+8]=f[B*9+8];
  f[B*9+6]=f[R*9+6];f[B*9+7]=f[R*9+7];f[B*9+8]=f[R*9+8];
  f[R*9+6]=t0;f[R*9+7]=t1;f[R*9+8]=t2; return f;
}
function moveR(src) {
  const f=clone(src); rotateFaceCW(f,R);
  const tU2=f[U*9+2],tU5=f[U*9+5],tU8=f[U*9+8];
  f[U*9+2]=f[F*9+2];f[U*9+5]=f[F*9+5];f[U*9+8]=f[F*9+8];
  f[F*9+2]=f[D*9+2];f[F*9+5]=f[D*9+5];f[F*9+8]=f[D*9+8];
  f[D*9+2]=f[B*9+6];f[D*9+5]=f[B*9+3];f[D*9+8]=f[B*9+0];
  f[B*9+0]=tU8;f[B*9+3]=tU5;f[B*9+6]=tU2; return f;
}
function moveL(src) {
  const f=clone(src); rotateFaceCW(f,L);
  const tU0=f[U*9+0],tU3=f[U*9+3],tU6=f[U*9+6];
  f[U*9+0]=f[B*9+8];f[U*9+3]=f[B*9+5];f[U*9+6]=f[B*9+2];
  f[B*9+2]=f[D*9+6];f[B*9+5]=f[D*9+3];f[B*9+8]=f[D*9+0];
  f[D*9+0]=f[F*9+0];f[D*9+3]=f[F*9+3];f[D*9+6]=f[F*9+6];
  f[F*9+0]=tU0;f[F*9+3]=tU3;f[F*9+6]=tU6; return f;
}
function moveF(src) {
  const f=clone(src); rotateFaceCW(f,F);
  const tU6=f[U*9+6],tU7=f[U*9+7],tU8=f[U*9+8];
  f[U*9+6]=f[L*9+8];f[U*9+7]=f[L*9+5];f[U*9+8]=f[L*9+2];
  f[L*9+2]=f[D*9+0];f[L*9+5]=f[D*9+1];f[L*9+8]=f[D*9+2];
  f[D*9+0]=f[R*9+6];f[D*9+1]=f[R*9+3];f[D*9+2]=f[R*9+0];
  f[R*9+0]=tU6;f[R*9+3]=tU7;f[R*9+6]=tU8; return f;
}
function moveB(src) {
  const f=clone(src); rotateFaceCW(f,B);
  const tU0=f[U*9+0],tU1=f[U*9+1],tU2=f[U*9+2];
  f[U*9+0]=f[R*9+2];f[U*9+1]=f[R*9+5];f[U*9+2]=f[R*9+8];
  f[R*9+2]=f[D*9+8];f[R*9+5]=f[D*9+7];f[R*9+8]=f[D*9+6];
  f[D*9+6]=f[L*9+0];f[D*9+7]=f[L*9+3];f[D*9+8]=f[L*9+6];
  f[L*9+0]=tU2;f[L*9+3]=tU1;f[L*9+6]=tU0; return f;
}

function applyMove(f, move) {
  const a2=(fn,x)=>fn(fn(x)), a3=(fn,x)=>fn(fn(fn(x)));
  switch(move) {
    case 'U':  return moveU(f); case "U'": return a3(moveU,f); case 'U2': return a2(moveU,f);
    case 'D':  return moveD(f); case "D'": return a3(moveD,f); case 'D2': return a2(moveD,f);
    case 'R':  return moveR(f); case "R'": return a3(moveR,f); case 'R2': return a2(moveR,f);
    case 'L':  return moveL(f); case "L'": return a3(moveL,f); case 'L2': return a2(moveL,f);
    case 'F':  return moveF(f); case "F'": return a3(moveF,f); case 'F2': return a2(moveF,f);
    case 'B':  return moveB(f); case "B'": return a3(moveB,f); case 'B2': return a2(moveB,f);
    default: throw new Error('Unknown move: '+move);
  }
}
function applyMoves(f,ms){let c=f.slice();for(const m of ms)c=applyMove(c,m);return c;}
function isSolved(f){for(let i=0;i<6;i++){const c=f[i*9+4];for(let p=0;p<9;p++)if(f[i*9+p]!==c)return false;}return true;}
function solved(){const f=[];for(let i=0;i<6;i++)for(let j=0;j<9;j++)f.push(i);return f;}
function eq(a,b){return a.every((v,i)=>v===b[i]);}

let pass=0, fail=0;
function test(name,fn){
  try{fn();console.log('  ✅',name);pass++;}
  catch(e){console.error('  ❌',name,':',e.message);fail++;}
}
function assert(c,m){if(!c)throw new Error(m);}

const s = solved();
console.log('\n=== cubeMoves.js Node test suite ===\n');

// isSolved
test('isSolved: solved=true',()=>assert(isSolved(s),''));
test('isSolved: after R = false',()=>assert(!isSolved(applyMove(s,'R')),''));

// Order 4
for(const fc of ['U','D','R','L','F','B'])
  test(`${fc}×4=identity`,()=>assert(eq(applyMoves(s,[fc,fc,fc,fc]),s),`${fc}×4`));

// Order 2 for double moves
for(const fc of ['U','D','R','L','F','B'])
  test(`${fc}2×2=identity`,()=>assert(eq(applyMoves(s,[fc+'2',fc+'2']),s),`${fc}2×2`));

// move + inverse = identity
for(const fc of ['U','D','R','L','F','B']) {
  test(`${fc}+${fc}'=identity`,()=>assert(eq(applyMoves(s,[fc,fc+"'"]),s),''));
  test(`${fc}'+${fc}=identity`,()=>assert(eq(applyMoves(s,[fc+"'",fc]),s),''));
  test(`${fc}2=${fc}+${fc}`,()=>assert(eq(applyMove(s,fc+'2'),applyMoves(s,[fc,fc])),''));
  test(`${fc}'=${fc}×3`,()=>assert(eq(applyMove(s,fc+"'"),applyMoves(s,[fc,fc,fc])),''));
}

// Known sticker positions
test('U: F top row gets R color',()=>{
  const f=applyMove(s,'U');
  assert(f[F*9+0]===R&&f[F*9+1]===R&&f[F*9+2]===R,'F top should be R color');
});
test('R: U right col gets F color',()=>{
  const f=applyMove(s,'R');
  assert(f[U*9+2]===F&&f[U*9+5]===F&&f[U*9+8]===F,'U right should be F color');
});
test('F: R left col gets U color',()=>{
  const f=applyMove(s,'F');
  assert(f[R*9+0]===U&&f[R*9+3]===U&&f[R*9+6]===U,'R left should be U color');
});
test('L: U left col gets B color',()=>{
  const f=applyMove(s,'L');
  // B right col (reversed) → U left col. B[8]=B,B[5]=B,B[2]=B → U[0],U[3],U[6]
  assert(f[U*9+0]===B&&f[U*9+3]===B&&f[U*9+6]===B,'U left should be B color after L');
});
test('D: R bottom row gets F color',()=>{
  const f=applyMove(s,'D');
  // D CW: F bottom → L, L bottom → B, B bottom → R, R bottom → F
  // So R bottom gets F's color
  assert(f[R*9+6]===F&&f[R*9+7]===F&&f[R*9+8]===F,'R bottom should be F color after D');
});
test('B: U top row gets R color',()=>{
  const f=applyMove(s,'B');
  // B CW: R right col → U top
  assert(f[U*9+0]===R&&f[U*9+1]===R&&f[U*9+2]===R,'U top should be R color after B');
});

// Scramble+inverse
test('Scramble+inverse=identity',()=>{
  const sc=['R','U',"B'",'L2','F',"D'",'U2','R'];
  const inv=["R'","U2",'D',"F'",'L2','B',"U'","R'"];
  const x=applyMoves(s,sc);
  assert(!isSolved(x),'scrambled');
  assert(eq(applyMoves(x,inv),s),'undo');
});

console.log(`\nResults: ${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
