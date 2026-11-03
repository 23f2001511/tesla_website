const sharp = require('sharp');
// Hub pivot in the 200x200 source logo
const HX = 81, HY = 74, SIDE = 118;
const LEFT = HX - SIDE/2, TOP = HY - SIDE/2; // 22..140 x 15..133
const dark = sharp('public/images/tesla-logo-dark.png').raw().toBuffer({resolveWithObject:true});
dark.then(({data,info})=>{
  const W=info.width, ch=info.channels;
  const out = Buffer.alloc(SIDE*SIDE*4);
  const x0=Math.round(LEFT), y0=Math.round(TOP);
  for(let dy=0;dy<SIDE;dy++) for(let dx=0;dx<SIDE;dx++){
    const sx=x0+dx, sy=y0+dy;
    const si=(sy*W+sx)*ch;
    const r=data[si], g=data[si+1], b=data[si+2], a=ch>3?data[si+3]:255;
    const oi=(dy*SIDE+dx)*4;
    // keep only saturated yellow (turbine blades + hub highlights); alpha-smooth edges
    if(a>20 && r>150 && g>130 && b<160 && (r-b)>50 && (g-b)>30){
      const minA=Math.min(1, (Math.max(0,(r-b)-30))/60);
      out[oi]=r; out[oi+1]=g; out[oi+2]=b; out[oi+3]=Math.round(Math.min(a,255*minA));
    }
  }
  return sharp(out,{raw:{width:SIDE,height:SIDE,channels:4}}).png().toFile('public/images/tesla-turbine-blades.png');
}).then(()=>{
  // print meta for component constants
  console.log('SPRITE_SIDE', SIDE, 'PIVOT_X', HX, 'PIVOT_Y', HY, 'SRC_PX', 200);
});
