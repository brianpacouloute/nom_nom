from fl sk import Flask, jsonify, Response

app = Flask(__name__)

# Waterloo Region demo dataset
RESTAURANTS = [
    {"id":"w1","name":"Uptown Pho","cuisine":"Vietnamese","price":"$","rating":4.5,"diet":["gluten_free"],"lat":43.466,"lng":-80.519,"access":["wheelchair_ramp"]},
    {"id":"w2","name":"King St. Pizza","cuisine":"Pizza","price":"$","rating":4.1,"diet":["vegetarian"],"lat":43.473,"lng":-80.524,"access":["step_free"]},
    {"id":"w3","name":"KW Tacos","cuisine":"Mexican","price":"$$","rating":4.4,"diet":["halal"],"lat":43.449,"lng":-80.489,"access":["braille_menu"]},
    {"id":"w4","name":"Gaukel Ramen","cuisine":"Japanese","price":"$$","rating":4.7,"diet":["vegetarian"],"lat":43.448,"lng":-80.492,"access":["accessible_washroom"]},
    {"id":"w5","name":"Cambridge Curry House","cuisine":"Indian","price":"$$","rating":4.6,"diet":["vegan","halal"],"lat":43.360,"lng":-80.317,"access":["wheelchair_ramp"]},
    {"id":"w6","name":"St. Jacobs Smokehouse","cuisine":"BBQ","price":"$$$","rating":4.2,"diet":[],"lat":43.539,"lng":-80.553,"access":["step_free"]},
    {"id":"w7","name":"University Falafel","cuisine":"Middle Eastern","price":"$","rating":4.3,"diet":["halal","vegetarian"],"lat":43.473,"lng":-80.540,"access":["accessible_washroom"]},
    {"id":"w8","name":"Conestoga BBQ","cuisine":"BBQ","price":"$$$","rating":4.1,"diet":[],"lat":43.422,"lng":-80.472,"access":[]},
    {"id":"w9","name":"Hespeler Shawarma","cuisine":"Middle Eastern","price":"$","rating":4.5,"diet":["halal"],"lat":43.430,"lng":-80.311,"access":[]},
    {"id":"w10","name":"Erb Street Sushi","cuisine":"Japanese","price":"$$","rating":4.4,"diet":["gluten_free"],"lat":43.462,"lng":-80.554,"access":["step_free"]},
    {"id":"w11","name":"Victoria Gelato","cuisine":"Dessert","price":"$","rating":4.8,"diet":["vegetarian"],"lat":43.446,"lng":-80.494,"access":["step_free"]},
    {"id":"w12","name":"Bridgeport Bistro","cuisine":"Bistro","price":"$$","rating":4.2,"diet":["vegetarian"],"lat":43.485,"lng":-80.509,"access":["wheelchair_ramp"]},
]

@app.get("/api/restaurants")
def api_restaurants():
    return jsonify(RESTAURANTS)

@app.get("/")
def index():
    # Single-file HTML with inline CSS/JS. No external deps.
    html = r"""<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width, initial-scale=1'>
<title>Nom Nom Wheel — Waterloo (Flask)</title>
<style>
:root{--bg:#0f172a;--panel:#111827;--text:#e5e7eb;--accent:#22d3ee;--accent2:#a78bfa;--warn:#f59e0b}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial;background:linear-gradient(120deg,var(--bg),#020617 70%);color:var(--text)}
header{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px 20px;position:sticky;top:0;z-index:10;background:rgba(2,6,23,.65);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.06)}
h1{font-size:20px;margin:0;letter-spacing:.2px}
main{max-width:1100px;margin:0 auto;padding:24px;display:grid;grid-template-columns:360px 1fr;gap:22px}
@media (max-width:980px){main{grid-template-columns:1fr}}
.card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}
.card h2{font-size:16px;margin:0 0 12px}
label{font-size:12px;color:#cbd5e1;display:block;margin-bottom:6px}
input,select{width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#0b1220;color:var(--text)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{appearance:none;border:none;border-radius:14px;padding:12px 14px;color:#0b1220;font-weight:700;cursor:pointer}
.btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2))}
.btn.subtle{background:#0b1220;color:#cbd5e1;border:1px solid rgba(255,255,255,.12)}
.btn.ghost{background:transparent;color:#cbd5e1;border:1px dashed rgba(255,255,255,.2)}
.controls{display:flex;gap:10px;flex-wrap:wrap}
.stack{display:flex;flex-direction:column;gap:12px}
#wheelWrap{position:relative;aspect-ratio:1/1}
#wheel{width:100%;height:auto;display:block}
#pointer{position:absolute;inset:-8px auto auto 50%;translate:-50% 0;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:18px solid var(--warn);filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))}
.result{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.25);padding:12px;border-radius:12px}
.pill{padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-size:12px}
.list{display:flex;flex-direction:column;gap:10px;max-height:340px;overflow:auto}
.item{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
.item small{color:#94a3b8}
.kbd{font-family:ui-monospace,Menlo,Consolas,monospace;background:#0b1220;border:1px solid rgba(255,255,255,.2);padding:2px 6px;border-radius:6px;font-size:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sep{height:1px;background:rgba(255,255,255,.08);margin:10px 0}
.rating{color:#fde68a}
</style>
</head>
<body>
<header>
  <h1>🍽️ Nom Nom Wheel — Waterloo</h1>
  <span style='padding:6px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;font-size:12px;color:#cbd5e1'>
    Spin: <span class='kbd'>Space</span> · Save: <span class='kbd'>S</span> · Re-spin: <span class='kbd'>R</span>
  </span>
</header>

<main>
  <section class='card stack' aria-label='Filters'>
    <h2>Filters</h2>
    <div class='stack'>
      <div class='row'>
        <div>
          <label for='cuisine'>Cuisine</label>
          <select id='cuisine'><option value=''>Any</option></select>
        </div>
        <div>
          <label for='diet'>Dietary</label>
          <select id='diet'>
            <option value=''>Any</option>
            <option value='vegan'>Vegan</option>
            <option value='vegetarian'>Vegetarian</option>
            <option value='gluten_free'>Gluten-free</option>
            <option value='halal'>Halal</option>
            <option value='kosher'>Kosher</option>
          </select>
        </div>
      </div>
      <div class='row'>
        <div>
          <label for='price'>Budget</label>
          <select id='price'>
            <option value=''>Any</option>
            <option value='$'>$</option><option value='$$'>$$</option><option value='$$$'>$$$</option><option value='$$$$'>$$$$</option>
          </select>
        </div>
        <div>
          <label for='radius'>Max distance (km)</label>
          <select id='radius'>
            <option value=''>Any</option><option>2</option><option>5</option><option>10</option><option>20</option>
          </select>
        </div>
      </div>
      <div class='grid2'>
        <button class='btn subtle' id='useGeo'>Use my location</button>
        <button class='btn ghost' id='clearFilters'>Clear filters</button>
      </div>
    </div>

    <div class='sep'></div>

    <h2>Favorites</h2>
    <div id='favList' class='list' aria-live='polite'></div>

    <div class='sep'></div>

    <h2>History</h2>
    <div id='histList' class='list' aria-live='polite'></div>
  </section>

  <section class='card stack' aria-label='Wheel and results'>
    <h2>Spin Wheel</h2>
    <div id='wheelWrap'>
      <canvas id='wheel' width='700' height='700' aria-label='Restaurant wheel' role='img'></canvas>
      <div id='pointer' aria-hidden='true'></div>
    </div>
    <div class='controls'>
      <button class='btn primary' id='spinBtn'>Spin</button>
      <button class='btn subtle' id='respinBtn'>Re-spin</button>
      <button class='btn ghost' id='saveBtn'>Save</button>
    </div>

    <div id='result' class='result' hidden>
      <div>
        <div id='resName' style='font-weight:800'></div>
        <small id='resMeta'></small>
      </div>
      <div>
        <span id='resRating' class='pill rating'>★ 0.0</span>
        <span id='resDistance' class='pill'>— km</span>
      </div>
    </div>

    <div class='sep'></div>

    <h2>Browse (filtered)</h2>
    <div id='browse' class='list' aria-live='polite'></div>
  </section>
</main>

<template id='itemTpl'>
  <div class='item'>
    <div style='min-width:0'>
      <div class='name' style='font-weight:700'></div>
      <small class='meta'></small>
    </div>
    <div style='display:flex;gap:8px;align-items:center'>
      <span class='pill rating'>★</span>
      <span class='pill dist'>— km</span>
      <button class='btn subtle addFav'>☆ Save</button>
    </div>
  </div>
</template>

<script>
// Utilities
const LS = { get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}, set(k,v){localStorage.setItem(k,JSON.stringify(v))} };
const toKm = n => (Math.round(n*10)/10).toFixed(1);
function haversine(lat1,lon1,lat2,lon2){ if([lat1,lon1,lat2,lon2].some(v=>v==null)) return null;
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }

// State
const state = { me:{lat:null,lng:null}, all:[], lastPick:null, currentPick:null, favorites:LS.get('nnw_favorites',[]), history:LS.get('nnw_history',[]) };

// Load data
async function loadRestaurants(){
  const res = await fetch('/api/restaurants'); state.all = await res.json();
  const cuisines = [...new Set(state.all.map(r=>r.cuisine))].sort();
  const sel = document.getElementById('cuisine');
  cuisines.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o); });
  renderBrowse();
}

// Filters
function getFilters(){
  return {
    cuisine: document.getElementById('cuisine').value || null,
    diet: document.getElementById('diet').value || null,
    price: document.getElementById('price').value || null,
    radius: document.getElementById('radius').value ? Number(document.getElementById('radius').value) : null,
  };
}
function applyFilters(){
  const f = getFilters();
  const withDist = state.all.map(r=>{ const d = state.me.lat!=null? haversine(state.me.lat,state.me.lng,r.lat,r.lng) : null; return {...r, distance:d}; });
  let out = withDist.filter(r=>{
    if(f.cuisine && r.cuisine!==f.cuisine) return false;
    if(f.price && r.price!==f.price) return false;
    if(f.diet && !(r.diet||[]).includes(f.diet)) return false;
    if(f.radius && r.distance!=null && r.distance>f.radius) return false;
    return true;
  });
  if(!out.length) out = withDist;
  if(out.length>1 && state.lastPick){ out = out.filter(r=>r.id!==state.lastPick.id) || out; }
  return out;
}

// Wheel
const canvas=document.getElementById('wheel'); const ctx=canvas.getContext('2d'); let currentSectors=[];
function drawWheel(sectors){
  currentSectors = sectors; const n=sectors.length||1; const cx=canvas.width/2, cy=canvas.height/2, r=canvas.width/2-14;
  ctx.clearRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.translate(cx,cy);
  const colors=['#06b6d4','#a78bfa','#22c55e','#f59e0b','#ef4444','#eab308','#38bdf8','#f472b6','#34d399','#fb7185'];
  for(let i=0;i<n;i++){ const start=(i/n)*Math.PI*2, end=((i+1)/n)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,start,end); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.save(); ctx.fillStyle='#0b1220'; ctx.rotate(start + (end-start)/2); ctx.textAlign='right'; ctx.font='bold 16px ui-sans-serif, system-ui'; ctx.fillText(sectors[i].name, r-16, 6); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0,0,48,0,Math.PI*2); ctx.fillStyle='#0b1220'; ctx.fill();
  ctx.font='700 18px ui-sans-serif, system-ui'; ctx.fillStyle='#e5e7eb'; ctx.textAlign='center'; ctx.fillText('SPIN',0,6);
  ctx.restore();
}
let spinAngle=0, spinning=false;
function spin(){ if(spinning || currentSectors.length===0) return; spinning=true;
  const n=currentSectors.length; const targetIndex=Math.floor(Math.random()*n); const slice=(Math.PI*2)/n;
  const targetAngle=(Math.PI*2) - (targetIndex*slice + slice/2); const extraTurns=4+Math.floor(Math.random()*3);
  const finalAngle=targetAngle + extraTurns*Math.PI*2; const start=performance.now(); const duration=3200+Math.random()*800;
  function frame(now){ const t=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-t,4);
    const angle=spinAngle + (finalAngle-spinAngle)*eased; canvas.style.transform=`rotate(${angle}rad)`;
    if(t<1){ requestAnimationFrame(frame); } else { spinAngle = angle%(Math.PI*2); spinning=false; const chosen=currentSectors[targetIndex]; onPick(chosen); } }
  requestAnimationFrame(frame);
}

// UI
const resBox=document.getElementById('result'), resName=document.getElementById('resName'), resMeta=document.getElementById('resMeta'), resRating=document.getElementById('resRating'), resDistance=document.getElementById('resDistance');
function onPick(r){
  state.currentPick=r; state.lastPick=r; state.history.unshift({id:r.id,name:r.name,at:new Date().toISOString()}); state.history=state.history.slice(0,50); LS.set('nnw_history',state.history); renderHistory();
  resName.textContent=r.name; resMeta.textContent=`${r.cuisine} · ${r.price} · ${(r.diet||[]).join(', ')||'No diet tags'}`; resRating.textContent=`★ ${r.rating.toFixed(1)}`; resDistance.textContent=r.distance!=null?`${toKm(r.distance)} km`:'— km'; resBox.hidden=false;
}
function renderList(container, items, withButtons=true){
  container.innerHTML=''; const tpl=document.getElementById('itemTpl');
  items.forEach(r=>{ const node=tpl.content.cloneNode(true); node.querySelector('.name').textContent=r.name;
    node.querySelector('.meta').textContent=[r.cuisine,r.price,(r.diet&&r.diet.length?r.diet.join(', '):'')].filter(Boolean).join(' · ');
    node.querySelector('.rating').textContent=`★ ${r.rating?.toFixed?r.rating.toFixed(1):r.rating}`;
    node.querySelector('.dist').textContent=r.distance!=null?`${toKm(r.distance)} km`:'— km';
    if(withButtons){ node.querySelector('.addFav').addEventListener('click',()=> addFavorite(r)); } else { node.querySelector('.addFav').remove(); }
    container.appendChild(node);
  });
}
function renderBrowse(){
  const list = applyFilters().map(r=>({...r, distance:r.distance}));
  list.sort((a,b)=> (a.distance??1e9) - (b.distance??1e9));
  renderList(document.getElementById('browse'), list, true); drawWheel(list);
}
function addFavorite(r){ if(!state.favorites.find(x=>x.id===r.id)){ state.favorites.push({id:r.id,name:r.name,rating:r.rating,cuisine:r.cuisine}); LS.set('nnw_favorites',state.favorites); renderFavorites(); } }
function removeFavorite(id){ state.favorites = state.favorites.filter(f=>f.id!==id); LS.set('nnw_favorites',state.favorites); renderFavorites(); }
function renderFavorites(){
  const container=document.getElementById('favList'); container.innerHTML='';
  state.favorites.forEach(f=>{ const div=document.createElement('div'); div.className='item';
    div.innerHTML = `<div><div style="font-weight:700">${f.name}</div><small class="meta">${f.cuisine}</small></div>` +
                    `<div style="display:flex;gap:8px;align-items:center"><span class="pill rating">★ ${f.rating?.toFixed?f.rating.toFixed(1):f.rating||'-'}</span><button class="btn ghost">Remove</button></div>`;
    div.querySelector('button').addEventListener('click',()=>removeFavorite(f.id)); container.appendChild(div);
  });
}
function renderHistory(){
  const container=document.getElementById('histList');
  const items=state.history.slice(0,20).map(h=>{ const r=state.all.find(x=>x.id===h.id)||{name:h.name,cuisine:''}; return {name:r.name,rating:r.rating||'-',cuisine:r.cuisine,distance:null}; });
  renderList(container, items, false);
}

// Events
document.getElementById('spinBtn').addEventListener('click', ()=>{ renderBrowse(); spin(); });
document.getElementById('respinBtn').addEventListener('click', ()=>{ spin(); });
document.getElementById('saveBtn').addEventListener('click', ()=>{ if(state.currentPick) addFavorite(state.currentPick); });
['cuisine','diet','price','radius'].forEach(id=> document.getElementById(id).addEventListener('change', renderBrowse));
document.getElementById('clearFilters').addEventListener('click', ()=>{ ['cuisine','diet','price','radius'].forEach(id=> document.getElementById(id).value=''); renderBrowse(); });

// Shortcuts
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); document.getElementById('spinBtn').click(); }
  else if(e.key.toLowerCase()==='r'){ document.getElementById('respinBtn').click(); }
  else if(e.key.toLowerCase()==='s'){ document.getElementById('saveBtn').click(); }
});
// Geolocation
document.getElementById('useGeo').addEventListener('click', ()=>{
  navigator.geolocation?.getCurrentPosition?.((pos)=>{ state.me.lat=pos.coords.latitude; state.me.lng=pos.coords.longitude; renderBrowse(); },
    ()=> alert('Could not get your location. You can still use the wheel.'));
});

// Init
function init(){ renderFavorites(); renderHistory(); loadRestaurants(); }
init();
</script>
</body>
</html>"""
    return Response(html, mimetype="text/html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

