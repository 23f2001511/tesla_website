const sharp = require('sharp');
Promise.all([
  sharp('public/images/tesla-logo-dark.png').raw().toBuffer({resolveWithObject:true}),
  sharp('public/images/tesla-turbine-blades.png').raw().toBuffer({resolveWithObject:true}),
]).then(([base, spr]) => {
  const W=base.info.width, ch=base.info.channels, S=spr.info.width;
  const d=base.data, sp=spr.data;
  const PX=81, PY=74, OX=PX-Math.floor(S/2), OY=PY-Math.floor(S/2);
  const yellow=(r,g,b,a)=>a>20 && r>150 && g>130 && b<160 && (r-b)>50 && (g-b)>30;
  let baseYellowInCrop=0, baseYellowInCropMatched=0;
  for(let y=0;y<200;y++) for(let x=0;x<200;x++){
    const i=(y*W+x)*ch, r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
    if(!yellow(r,g,b,a)) continue;
    const lx=x-OX, ly=y-OY;
    if(lx<0||lx>=S||ly<0||ly>=S) continue; // outside sprite region
    baseYellowInCrop++;
    const si=(ly*S+lx)*4;
    if(sp[si+3]>20) baseYellowInCropMatched++;
  }
  console.log('base yellow px inside crop:', baseYellowInCrop, 'matched by sprite:', baseYellowInCropMatched, 'pct:', (100*baseYellowInCropMatched/baseYellowInCrop).toFixed(2));
});
