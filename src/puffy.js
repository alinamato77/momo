/* Puffy star: a pillow-shaped star built from Momo's own Spline outline.
   Returns flat arrays (vertices, normals, indices) in the star mesh's local units,
   centred on z = 0 so the front surface bulges toward +z. */
function puffyStar(opt){
  const o=Object.assign({
    // Momo's 10 outline points from the Spline file (outer tips + inner valleys)
    pts:[[0,425.7],[-105,131.5],[-444.9,131.6],[-169.9,-50.2],[-274.9,-344.4],[0,-162.6],[274.9,-344.4],[169.9,-50.2],[444.9,131.6],[105,131.5]],
    full:.8,      // <1 fattens the arms (valleys move outward)
    round:.095,   // corner rounding, radians of smoothing
    depth:.3,     // half-thickness at the centre, as a share of the outer radius
    soft:3.2,     // p-norm exponent for the soft distance to the outline
    back:.8,      // back is a little flatter than the front
    N:400, M:34
  },opt||{});
  const P=o.pts,T=1440,TAU=Math.PI*2;
  // 1. radial profile r(θ) by casting rays from the centre
  const r=new Float64Array(T);
  for(let i=0;i<T;i++){const a=i/T*TAU,dx=Math.cos(a),dy=Math.sin(a);let best=0;
    for(let k=0;k<P.length;k++){const [x1,y1]=P[k],[x2,y2]=P[(k+1)%P.length];const ex=x2-x1,ey=y2-y1;
      const den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const t=(x1*ey-y1*ex)/den,u=(x1*dy-y1*dx)/den;
      if(t>0&&u>=0&&u<=1&&t>best)best=t}
    r[i]=best}
  let rmax=0;for(const v of r)rmax=Math.max(rmax,v);
  // 2. fuller arms, then circular gaussian smoothing for soft tips and valleys
  for(let i=0;i<T;i++)r[i]=rmax*Math.pow(r[i]/rmax,o.full);
  const sig=o.round/TAU*T,W=Math.ceil(sig*3),ker=[];let ks=0;
  for(let k=-W;k<=W;k++){const w=Math.exp(-k*k/(2*sig*sig));ker.push(w);ks+=w}
  const rs=new Float64Array(T);
  for(let i=0;i<T;i++){let s=0;for(let k=-W;k<=W;k++)s+=r[(i+k+T)%T]*ker[k+W];rs[i]=s/ks}
  let rsmax=0;for(const v of rs)rsmax=Math.max(rsmax,v);
  const sc=rmax*.97/rsmax;
  // 3. outline polygon
  const N=o.N,ox=new Float64Array(N),oy=new Float64Array(N);
  for(let i=0;i<N;i++){const a=i/N*TAU+Math.PI/2;const idx=((a%TAU)+TAU)%TAU/TAU*T;const i0=Math.floor(idx),fr=idx-i0;const rr=(rs[i0%T]*(1-fr)+rs[(i0+1)%T]*fr)*sc;ox[i]=Math.cos(a)*rr;oy[i]=Math.sin(a)*rr}
  // soft distance to the outline (p-norm over the edge) avoids creases along the arms' centre lines
  const segLen=new Float64Array(N);for(let k=0;k<N;k++)segLen[k]=Math.hypot(ox[(k+1)%N]-ox[k],oy[(k+1)%N]-oy[k]);
  const PW=o.soft;let CP=0;for(let u=-200;u<=200;u+=.01)CP+=Math.pow(1+u*u,-PW/2)*.01; // ∫(1+u²)^(-p/2)du
  const segDist=(px,py)=>{let acc=0;for(let k=0;k<N;k++){const ax=ox[k],ay=oy[k],bx=ox[(k+1)%N],by=oy[(k+1)%N];const ex=bx-ax,ey=by-ay;let t=((px-ax)*ex+(py-ay)*ey)/(ex*ex+ey*ey);t=t<0?0:t>1?1:t;const qx=ax+ex*t-px,qy=ay+ey*t-py;const d=Math.sqrt(qx*qx+qy*qy)+1e-6;acc+=segLen[k]*Math.pow(d,-PW)}return Math.pow(acc/CP,-1/(PW-1))};
  // 4. rings from centre (s=0) to edge (s=1), crowded near the edge
  const M=o.M,S=[];for(let j=0;j<=M;j++)S.push(Math.sin(j/M*Math.PI/2));
  const D=segDist(0,0)*1.0,H=o.depth*rmax;
  const rows=[];
  for(let j=0;j<=M;j++){const row=[];for(let i=0;i<N;i++){const x=ox[i]*S[j],y=oy[i]*S[j];const d=j===M?0:segDist(x,y);const q=Math.min(d/D,1);row.push([x,y,H*Math.sqrt(Math.max(0,1-(1-q)*(1-q)))])}rows.push(row)}
  const V=[];const addRow=(row,sgn)=>{for(const [x,y,h] of row)V.push(x,y,sgn>0?h:-h*o.back)};
  for(let j=0;j<=M;j++)addRow(rows[j],1);           // front: centre → edge
  for(let j=M-1;j>=0;j--)addRow(rows[j],-1);         // back: edge → centre
  const R=2*M+1,I=[];
  for(let j=0;j<R-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;I.push(a,c,b,b,c,d)}
  // edge ring is shared: row M is the edge; back rows start at index (M+1)*N with ring M-1, so stitch is via row M (included once)
  // smooth normals
  const nv=new Float64Array(V.length);
  for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3;
    const ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],vx=V[c]-V[a],vy=V[c+1]-V[a+1],vz=V[c+2]-V[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const k of[a,b,c]){nv[k]+=nx;nv[k+1]+=ny;nv[k+2]+=nz}}
  // make the front face outward (+z)
  const probe=(Math.floor(M/2)*N)*3+2;let flip=nv[probe]<0;if(flip){for(let t=0;t<I.length;t+=3){const x=I[t+1];I[t+1]=I[t+2];I[t+2]=x}for(let k=0;k<nv.length;k++)nv[k]=-nv[k]}
  for(let k=0;k<nv.length;k+=3){const l=Math.hypot(nv[k],nv[k+1],nv[k+2])||1;nv[k]/=l;nv[k+1]/=l;nv[k+2]/=l}
  // centre rows collapse to a point; give them a clean axial normal
  for(let i=0;i<N;i++){nv[i*3]=0;nv[i*3+1]=0;nv[i*3+2]=1;const k=((R-1)*N+i)*3;nv[k]=0;nv[k+1]=0;nv[k+2]=-1}
  const hAt=(x,y)=>{const d=segDist(x,y);const q=Math.min(d/D,1);return H*Math.sqrt(Math.max(0,1-(1-q)*(1-q)))};
  return{vertices:new Float32Array(V),normals:new Float32Array(nv),indices:new Uint32Array(I),height:H,hAt,rmax};
}
