const sharp = require('sharp');
sharp('public/images/tesla-logo-dark.png').raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{
  const W=info.width, H=info.height, ch=info.channels;
  let pts=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=(y*W+x)*ch, r=data[i],g=data[i+1],b=data[i+2],a=ch>3?data[i+3]:255;
    if(a<60) continue;
    if(r>180 && g>150 && b<130){ pts.push([x,y]); }
  }
  // score a candidate hub by how equal the three 120-deg blade tip radii are
  best=null;
  for(let cy=70;cy<=88;cy++) for(let cx=76;cx<=86;cx++){
    const sectors=[0,120,240]; let tips=[0,0,0];
    sectors.forEach((deg,si)=>{
      const rad=deg*Math.PI/180, dx=Math.cos(rad), dy=Math.sin(rad);
      let bestd=0;
      // only points roughly in the sector (±35 deg) and outward of r=12
      for(const [x,y] of pts){
        const rx=x-cx, ry=y-cy, d=Math.hypot(rx,ry); if(d<12) continue;
        const ang=(Math.atan2(ry,rx)*180/Math.PI);
        let diff=Math.abs(ang-deg); if(diff>180) diff=360-diff;
        if(diff<=38 && d>bestd) bestd=d;
      }
      tips[si]=bestd;
    });
    const mean=(tips[0]+tips[1]+tips[2])/3;
    const var3=((tips[0]-mean)**2+(tips[1]-mean)**2+(tips[2]-mean)**2)/3;
    const score=var3+Math.abs(mean-58)*0.1;
    if(!best || var3<best.var) best={cx,cy,tips,var:var3,mean};
  }
  console.log('best hub', best.cx, best.cy, 'tip radii', best.tips, 'var', best.var, 'mean', best.mean);
});
