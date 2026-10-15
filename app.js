import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#070b12');
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .05, 4500);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('loadStatus').textContent = '無法啟動 WebGL，請使用支援硬體加速的 Chrome 或 Edge。';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
$('space').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.minDistance = 1.4;
controls.maxDistance = 850;
controls.enablePan = true;
const ambient = new THREE.AmbientLight(0x9ebbe0, .22);
scene.add(ambient);
const sunlight = new THREE.PointLight(0xfff3db, 3.5, 0, 0);
scene.add(sunlight);
const earthSystem = new THREE.Group();
scene.add(earthSystem);
const axialTilt = new THREE.Group();
axialTilt.rotation.z = THREE.MathUtils.degToRad(-23.44);
earthSystem.add(axialTilt);
const geometry = new THREE.SphereGeometry(3.2, 96, 64);
const earth = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 16, specular: 0x33404a }));
axialTilt.add(earth);
const clouds = new THREE.Mesh(new THREE.SphereGeometry(3.235, 80, 48), new THREE.MeshPhongMaterial({ transparent: true, opacity: .6, depthWrite: false }));
axialTilt.add(clouds);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(3.34, 80, 48), new THREE.ShaderMaterial({
  uniforms: { glowColor: { value: new THREE.Color(0x478bc4) } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',
  fragmentShader: 'uniform vec3 glowColor; varying vec3 vN; varying vec3 vV; void main(){ float rim=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.5); gl_FragColor=vec4(glowColor,rim*0.38); }',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
}));
earthSystem.add(atmosphere);
const moon = new THREE.Mesh(new THREE.SphereGeometry(.8736, 64, 48), new THREE.MeshPhongMaterial({ color: 0xe0dfdc, shininess: 2 }));
earthSystem.add(moon);
const moonPlane = new THREE.Group();
moonPlane.rotation.x = THREE.MathUtils.degToRad(5.145);
earthSystem.add(moonPlane);
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xb9aa87, transparent: true, opacity: .28 });
function orbit(radius, material) {
  const points = Array.from({length: 257}, (_, i) => new THREE.Vector3(Math.cos(i / 256 * TAU) * radius, 0, Math.sin(i / 256 * TAU) * radius));
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
}
const moonOrbit = orbit(14, orbitMaterial);
moonPlane.add(moonOrbit);
const earthOrbit = orbit(160, new THREE.LineBasicMaterial({ color: 0xb9aa87, transparent: true, opacity: .22 }));
scene.add(earthOrbit);
const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-4.1,0),new THREE.Vector3(0,4.1,0)]), new THREE.LineDashedMaterial({color:0x9bb5c4,dashSize:.17,gapSize:.16,transparent:true,opacity:.28}));
axis.computeLineDistances();axialTilt.add(axis);
const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 48), new THREE.MeshBasicMaterial({ color: 0xffd08b }));
scene.add(sun);
const glowCanvas = document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;
const gc=glowCanvas.getContext('2d');const gradient=gc.createRadialGradient(128,128,12,128,128,128);
gradient.addColorStop(0,'rgba(255,226,168,0.9)');gradient.addColorStop(.23,'rgba(255,174,74,0.4)');gradient.addColorStop(.55,'rgba(231,124,41,0.09)');gradient.addColorStop(1,'rgba(231,124,41,0)');
gc.fillStyle=gradient;gc.fillRect(0,0,256,256);
const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));sunGlow.scale.set(95,95,1);scene.add(sunGlow);
// Seeded stars keep the same sky on every launch.
let seed=42;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const starsPos=[],starsColor=[];
for(let i=0;i<3400;i++){const a=random()*TAU,z=random()*2-1,r=1100+random()*900,s=Math.sqrt(1-z*z);starsPos.push(r*s*Math.cos(a),r*z,r*s*Math.sin(a));const light=.25+random()*.6;starsColor.push(light*.85,light*.91,light);}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starsPos,3));starGeometry.setAttribute('color',new THREE.Float32BufferAttribute(starsColor,3));
scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({size:1.5,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.8})));

let day=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=.5,view='earth',showLabels=true;
let transition=null;
const worldEarth=new THREE.Vector3(),worldMoon=new THREE.Vector3(),lastFocus=new THREE.Vector3();
const target=new THREE.Vector3(),projected=new THREE.Vector3();
function positions(){
  const ea=-day/365.25*TAU;
  earthSystem.position.set(Math.cos(ea)*160,0,Math.sin(ea)*160);
  earth.rotation.y=day/.99726968*TAU+.6;
  clouds.rotation.y=earth.rotation.y+day*.035;
  const ma=-day/27.3217*TAU+1.15;
  moon.position.set(Math.cos(ma)*14,0,Math.sin(ma)*14).applyAxisAngle(new THREE.Vector3(1,0,0),moonPlane.rotation.x);
  // Local +Z continuously faces Earth: synchronous rotation.
  moon.lookAt(earthSystem.position);
  scene.updateMatrixWorld(true);
  earthSystem.getWorldPosition(worldEarth);moon.getWorldPosition(worldMoon);
  moon.lookAt(worldEarth);scene.updateMatrixWorld(true);
}
function focus(){return view==='solar'?target.set(0,0,0):view==='moon'?target.copy(worldMoon):target.copy(worldEarth);}
function setView(next,instant=false){
  view=next;positions();
  const f=focus().clone();
  const mobile=innerWidth<=720;
  const offset=next==='solar'?new THREE.Vector3(0,260,355):next==='moon'?new THREE.Vector3(-3.4,2.1,4.5):new THREE.Vector3(-12,13,mobile?48:33);
  if(instant){camera.position.copy(f).add(offset);controls.target.copy(f);transition=null;}
  else transition={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),offset};
  lastFocus.copy(f);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('viewCaption').innerHTML={earth:'地月系統 <span> / EARTH–MOON SYSTEM</span>',solar:'日地全景 <span> / SOLAR PERSPECTIVE</span>',moon:'近看月球 <span> / LUNAR CLOSE-UP</span>'}[view];
}
function phaseData(){
  const toSun=worldMoon.clone().negate().normalize(),toEarth=worldEarth.clone().sub(worldMoon).normalize();
  const fraction=THREE.MathUtils.clamp((1+toSun.dot(toEarth))/2,0,1);
  const moonVector=worldMoon.clone().sub(worldEarth),sunVector=worldEarth.clone().negate();
  let elongation=Math.atan2(sunVector.z,sunVector.x)-Math.atan2(moonVector.z,moonVector.x);elongation=(elongation%TAU+TAU)%TAU;
  const names=['新月','眉月','上弦月','盈凸月','滿月','虧凸月','下弦月','殘月'];
  return {fraction,elongation,name:names[Math.round(elongation/TAU*8)%8]};
}
const phaseCtx=$('phase').getContext('2d');
function drawPhase(data){
  const ctx=phaseCtx,sz=120,r=49,c=60;ctx.clearRect(0,0,sz,sz);
  const image=ctx.createImageData(sz,sz);const cos=2*data.fraction-1,sin=Math.sqrt(Math.max(0,1-cos*cos))*(data.elongation<Math.PI?1:-1);
  for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){const nx=(x-c)/r,ny=(y-c)/r,rr=nx*nx+ny*ny;if(rr>1)continue;const nz=Math.sqrt(1-rr),light=Math.max(0,nx*sin+nz*cos),noise=.94+.06*Math.sin(x*1.7+y*2.4),v=(22+175*Math.pow(light,.55))*noise,j=(y*sz+x)*4;image.data[j]=v*1.03;image.data[j+1]=v;image.data[j+2]=v*.92;image.data[j+3]=Math.min(255,(1-rr)*2400);}
  ctx.putImageData(image,0,0);
}
function updateUI(){
  $('day').textContent=day.toFixed(1);$('time').value=day;
  $('orbitProgress').textContent=((day%27.3217)/27.3217*100).toFixed(0)+'%';
  const phase=phaseData();$('phaseName').textContent=phase.name;$('illumination').textContent=(phase.fraction*100).toFixed(1)+'%';drawPhase(phase);
}
function label(id,position,radius){
  const el=$(id);projected.copy(position);projected.y-=radius+ .65;projected.project(camera);
  const w=$('space').clientWidth,h=$('space').clientHeight;
  const visible=showLabels&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.92&&(id!=='sunLabel'||view==='solar')&&(id!=='earthLabel'||view!=='moon');
  el.style.display=visible?'block':'none';el.style.left=(projected.x*.5+.5)*w+12+'px';el.style.top=(-projected.y*.5+.5)*h+'px';
}
function syncPlay(){ $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暫停模擬':'播放模擬'); }
$('play').onclick=()=>{playing=!playing;syncPlay();};syncPlay();
$('speed').onchange=e=>speed=Number(e.target.value);
$('time').oninput=e=>{day=Number(e.target.value);positions();updateUI();};
$('restart').onclick=()=>{day=0;positions();setView(view,true);updateUI();};
$('reset').onclick=()=>setView(view);
$('orbits').onchange=e=>{moonOrbit.visible=earthOrbit.visible=axis.visible=e.target.checked;};
$('labels').onchange=e=>showLabels=e.target.checked;
$('clouds').onchange=e=>clouds.visible=e.target.checked;
$('infoBtn').onclick=()=>$('info').showModal();
$('info').addEventListener('click',e=>{if(e.target===$('info')){const r=$('info').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('info').close();}});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch(e){$('fullscreen').title='目前瀏覽器不支援全螢幕';}};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
controls.addEventListener('start',()=>transition=null);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)&&!$('info').open){e.preventDefault();playing=!playing;syncPlay();}});
function resize(){const w=$('space').clientWidth,h=$('space').clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
window.addEventListener('resize',resize);resize();positions();setView('earth',true);updateUI();
let previous=performance.now(),lastUI=0;
function animate(now){
  const dt=Math.min((now-previous)/1000,.1);previous=now;
  if(playing&&!document.hidden)day=(day+dt*speed)%365.25;
  positions();const f=focus();
  if(transition){const p=Math.min((now-transition.start)/1100,1),t=p*p*(3-2*p);camera.position.lerpVectors(transition.from,f.clone().add(transition.offset),t);controls.target.lerpVectors(transition.fromTarget,f,t);if(p===1)transition=null;}
  else{const delta=f.clone().sub(lastFocus);camera.position.add(delta);controls.target.add(delta);}
  lastFocus.copy(f);controls.update();
  label('earthLabel',worldEarth,3.2);label('moonLabel',worldMoon,.87);label('sunLabel',sun.position,12);
  if(now-lastUI>120){updateUI();lastUI=now;}
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
const loader=new THREE.TextureLoader();
async function texture(path){const t=await loader.loadAsync(path);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
try{
  const [earthMap,moonMap,cloudMap]=await Promise.all([texture('./assets/earth.jpg'),texture('./assets/moon.jpg'),texture('./assets/clouds.png')]);
  earth.material.map=earthMap;earth.material.needsUpdate=true;
  moon.material.map=moonMap;moon.material.bumpMap=moonMap;moon.material.bumpScale=.025;moon.material.needsUpdate=true;
  clouds.material.map=cloudMap;clouds.material.needsUpdate=true;
  $('loading').style.opacity=0;setTimeout(()=>$('loading').remove(),650);
  window.__orbit={ready:true,getState:()=>({day,playing,speed,view,orbits:moonOrbit.visible,labels:showLabels,clouds:clouds.visible,phase:phaseData(),earth:worldEarth.toArray(),moon:worldMoon.toArray(),drawCalls:renderer.info.render.calls})};
  previous=performance.now();requestAnimationFrame(animate);
}catch(error){$('loadStatus').textContent='素材載入失敗，請透過本地伺服器開啟，並重新整理。';console.error(error);}
