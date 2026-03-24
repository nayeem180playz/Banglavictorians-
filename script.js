import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBb2_hifyeWdf6utoXiE4hxa35b-b6_xww",
    authDomain: "bangla-victorians-8ead2.firebaseapp.com",
    projectId: "bangla-victorians-8ead2",
    storageBucket: "bangla-victorians-8ead2.firebasestorage.app",
    messagingSenderId: "628248840218",
    appId: "1:628248840218:web:f8d29e0fe290dd8c16a9a3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper: Create URL friendly slugs
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

// --- UI TRIGGERS ---
window.toggleLogin = () => { const m=document.getElementById('login-modal'); m.style.display=m.style.display==='flex'?'none':'flex'; }
window.toggleSponsor = () => { const m=document.getElementById('sponsor-modal'); m.style.display=m.style.display==='flex'?'none':'flex'; }
window.toggleMobile = () => { const m=document.getElementById('mobile-nav'); m.style.display=m.style.display==='block'?'none':'block'; }
window.tab = (id) => { 
    document.querySelectorAll('.adm-section').forEach(e=>e.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    event.target.classList.add('active');
}
window.goHome = () => { document.getElementById('user-view').style.display='block'; document.getElementById('admin-view').style.display='none'; }
window.clearForm = (p) => { 
    document.querySelectorAll(`[id^="${p}-"]`).forEach(i => i.value = ""); 
    const btn = document.getElementById(p+'-btn');
    if(btn) btn.innerText = (p === 'p' ? "SAVE PLAYER" : "PUBLISH NOW");
}

// --- AUTHENTICATION ---
window.login = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    signInWithEmailAndPassword(auth, email, pass)
    .then(() => { 
        document.getElementById('user-view').style.display='none'; 
        document.getElementById('admin-view').style.display='block'; 
        toggleLogin(); loadData(); loadConfig(); 
    })
    .catch(e => alert("Login Failed: " + e.message));
}
window.logout = () => signOut(auth).then(()=>location.reload());

// --- SETTINGS & STATS ---
async function loadConfig() {
    const c = await getDoc(doc(db,"settings","config"));
    if(c.exists()) {
        const h = document.getElementById('hero');
        if(c.data().bg) h.style.background = `url('${c.data().bg}') center/cover no-repeat`;
        if(document.getElementById('cfg-bg')) document.getElementById('cfg-bg').value = c.data().bg;
    }
    const s = await getDoc(doc(db,"settings","stats"));
    if(s.exists()) {
        const d = s.data();
        ['rank','matches','win','titles'].forEach(k => {
            const el = document.getElementById('stat-'+k);
            if(el) el.innerText = d[k];
            const inp = document.getElementById('cfg-'+k);
            if(inp) inp.value = d[k];
        });
    }
}
window.saveConfig = async () => { await setDoc(doc(db,"settings","config"), {bg: document.getElementById('cfg-bg').value}); alert("Hero Background Updated!"); loadConfig(); }
window.saveStats = async () => {
    const d = { rank:document.getElementById('cfg-rank').value, matches:document.getElementById('cfg-matches').value, win:document.getElementById('cfg-win').value, titles:document.getElementById('cfg-titles').value };
    await setDoc(doc(db,"settings","stats"), d); alert("Stats Updated Successfully!"); loadConfig();
}

// --- CRUD OPERATIONS ---
window.delItem = async (col, id) => { if(confirm("Are you sure you want to delete this?")) { await deleteDoc(doc(db, col, id)); loadData(); } }

window.prepareEdit = (prefix, id, dataStr) => {
    const d = JSON.parse(decodeURIComponent(dataStr));
    document.getElementById(prefix+'-id').value = id;
    for(let key in d) { 
        const input = document.getElementById(prefix+'-'+key);
        if(input) input.value = d[key]; 
    }
    const btn = document.getElementById(prefix+'-btn');
    if(btn) btn.innerText = "UPDATE DATA";
    tab(prefix === 'p' ? 'ros' : (prefix === 'n' ? 'new' : 'tip'));
}

// Save Roster
window.savePlayer = async () => {
    const id = document.getElementById('p-id').value;
    const p = { name:document.getElementById('p-name').value, ign:document.getElementById('p-ign').value, role:document.getElementById('p-role').value, uid:document.getElementById('p-uid').value, age:document.getElementById('p-age').value, img:document.getElementById('p-img').value, profile:document.getElementById('p-prof').value, kd:document.getElementById('p-kd').value, win:document.getElementById('p-win').value, desc:document.getElementById('p-desc').value, seo:document.getElementById('p-seo').value, time:Date.now() };
    if(id) await updateDoc(doc(db,"roster",id), p); else await addDoc(collection(db,"roster"), p);
    alert("Player Data Saved!"); clearForm('p'); loadData();
}

// Save News
window.saveNews = async () => {
    const id = document.getElementById('n-id').value;
    const n = { title:document.getElementById('n-title').value, img:document.getElementById('n-img').value, desc:document.getElementById('n-desc').value, seo:document.getElementById('n-seo').value, date:new Date().toLocaleDateString(), time:Date.now() };
    if(id) await updateDoc(doc(db,"blogs",id), n); else await addDoc(collection(db,"blogs"), n);
    alert("News Published!"); clearForm('n'); loadData();
}

// Save Tip
window.saveTip = async () => {
    const id = document.getElementById('t-id').value;
    const t = { title:document.getElementById('t-title').value, img:document.getElementById('t-img').value, desc:document.getElementById('t-desc').value, seo:document.getElementById('t-seo').value, date:new Date().toLocaleDateString(), time:Date.now() };
    if(id) await updateDoc(doc(db,"tips",id), t); else await addDoc(collection(db,"tips"), t);
    alert("Tip Published!"); clearForm('t'); loadData();
}

// Others
window.saveVideo = async () => {
    const u = document.getElementById('v-url').value;
    const vid = u.split('v=')[1]?.split('&')[0] || u.split('/').pop();
    await addDoc(collection(db,"videos"), {title:document.getElementById('v-title').value, url:`https://www.youtube.com/embed/${vid}`, time:Date.now()});
    loadData(); document.getElementById('v-url').value=""; document.getElementById('v-title').value="";
}
window.saveImage = async () => { await addDoc(collection(db,"gallery"), {url:document.getElementById('g-url').value, time:Date.now()}); loadData(); document.getElementById('g-url').value=""; }
window.postComment = async () => { const n=document.getElementById('c-name').value, m=document.getElementById('c-msg').value; if(n&&m){ await addDoc(collection(db,"comments"),{name:n, msg:m, time:Date.now()}); loadData(); document.getElementById('c-msg').value=""; } }
window.submitSponsor = async () => { await addDoc(collection(db,"sponsors"), {name:document.getElementById('s-name').value, wp:document.getElementById('s-wp').value, desc:document.getElementById('s-desc').value, time:Date.now()}); alert("Sponsorship Request Sent!"); toggleSponsor(); loadData(); }

// --- RENDER DATA ---
async function loadData() {
    // 1. Roster
    const s1 = await getDocs(query(collection(db,"roster"), orderBy("time","asc")));
    let h1="", a1="";
    s1.forEach(d => {
        const v = d.data();
        h1 += `<a href="details.html?type=roster&id=${slugify(v.ign)}" class="player-card">
                <img src="${v.img}" class="p-img" alt="${v.ign}">
                <div class="p-info"><span class="p-role">${v.role}</span><h3 class="p-name">${v.ign}</h3></div>
                <div class="view-btn">VIEW PROFILE</div></a>`;
        a1 += `<div class="adm-item"><span>${v.ign}</span><div><button onclick="prepareEdit('p','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('roster','${d.id}')" style="background:red; color:white;">DEL</button></div></div>`;
    });
    document.getElementById('roster-list').innerHTML = h1;
    if(document.getElementById('adm-roster')) document.getElementById('adm-roster').innerHTML = a1;

    // 2. News
    const s2 = await getDocs(query(collection(db,"blogs"), orderBy("time","desc")));
    let h2="", a2="";
    s2.forEach(d => {
        const v = d.data();
        h2 += `<a href="details.html?type=news&id=${slugify(v.title)}" class="vid-card">
                <div class="vid-thumb"><img src="${v.img}"></div>
                <div class="vid-info">
                    <div class="vid-meta" style="color:var(--primary); font-size:0.8rem; margin-bottom:5px;">${v.date || 'LATEST NEWS'}</div>
                    <span class="vid-title">${v.title}</span>
                </div></a>`;
        a2 += `<div class="adm-item"><span>${v.title}</span><div><button onclick="prepareEdit('n','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('blogs','${d.id}')" style="background:red; color:white;">DEL</button></div></div>`;
    });
    document.getElementById('news-list').innerHTML = h2;
    if(document.getElementById('adm-news')) document.getElementById('adm-news').innerHTML = a2;

    // 3. Tips
    const s3 = await getDocs(query(collection(db,"tips"), orderBy("time","desc")));
    let h3="", a3="";
    s3.forEach(d => {
        const v = d.data();
        h3 += `<a href="details.html?type=tips&id=${slugify(v.title)}" class="vid-card">
                <div class="vid-thumb"><img src="${v.img}"></div>
                <div class="vid-info">
                    <div class="vid-meta" style="color:var(--primary); font-size:0.8rem; margin-bottom:5px;">${v.date || 'PRO TIPS'}</div>
                    <span class="vid-title">${v.title}</span>
                </div></a>`;
        a3 += `<div class="adm-item"><span>${v.title}</span><div><button onclick="prepareEdit('t','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('tips','${d.id}')" style="background:red; color:white;">DEL</button></div></div>`;
    });
    document.getElementById('tips-list').innerHTML = h3;
    if(document.getElementById('adm-tips')) document.getElementById('adm-tips').innerHTML = a3;

    // 4. Videos & Gallery
    const s4 = await getDocs(query(collection(db,"videos"), orderBy("time","desc")));
    let h4="", a4=""; s4.forEach(d => { 
        h4 += `<div class="vid-card"><div class="vid-thumb"><iframe src="${d.data().url}"></iframe></div><div class="vid-info"><span class="vid-title">${d.data().title}</span></div></div>`;
        a4 += `<div class="adm-item"><span>${d.data().title}</span><button onclick="delItem('videos','${d.id}')" style="background:red; color:white;">DEL</button></div>`;
    });
    document.getElementById('video-list').innerHTML = h4;
    if(document.getElementById('adm-video')) document.getElementById('adm-video').innerHTML = a4;

    const s5 = await getDocs(query(collection(db,"gallery"), orderBy("time","desc")));
    let h5="", a5=""; s5.forEach(d => { 
        h5 += `<img src="${d.data().url}" class="gal-img" onclick="openGallery('${d.data().url}')">`;
        a5 += `<div class="adm-item"><span>Image ID: ${d.id.substring(0,5)}</span><button onclick="delItem('gallery','${d.id}')" style="background:red; color:white;">DEL</button></div>`;
    });
    document.getElementById('gallery-list').innerHTML = h5;
    if(document.getElementById('adm-gallery')) document.getElementById('adm-gallery').innerHTML = a5;

    // 5. Fans & Sponsors (Admin Only Display)
    const s6 = await getDocs(query(collection(db,"comments"), orderBy("time","desc")));
    let h6="", a6=""; s6.forEach(d => { 
        h6 += `<div class="fan-box"><strong>${d.data().name}</strong><p>${d.data().msg}</p></div>`;
        a6 += `<div class="adm-item" style="flex-direction:column; align-items:flex-start;"><b>${d.data().name} says:</b> <p>${d.data().msg}</p> <button onclick="delItem('comments','${d.id}')" style="background:red; color:white; margin-top:5px;">DEL</button></div>`;
    });
    document.getElementById('comm-list').innerHTML = h6;
    if(document.getElementById('adm-fans')) document.getElementById('adm-fans').innerHTML = a6;

    const s7 = await getDocs(query(collection(db,"sponsors"), orderBy("time","desc")));
    let a7=""; s7.forEach(d => { 
        a7 += `<div class="adm-item" style="flex-direction:column; align-items:flex-start;"><b>${d.data().name} (${d.data().wp})</b><p style="font-size:0.9rem; color:#aaa;">${d.data().desc}</p><button onclick="delItem('sponsors','${d.id}')" style="background:red; color:white; margin-top:5px;">DEL</button></div>`;
    });
    if(document.getElementById('adm-sponsors')) document.getElementById('adm-sponsors').innerHTML = a7;
}

window.openGallery = (u) => { document.getElementById('gm-img').src = u; document.getElementById('gallery-popup').style.display='flex'; }

loadConfig(); loadData();