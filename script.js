import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBb2_hifyeWdf6utoXiE4hxa35b-b6_xww",
    authDomain: "bangla-victorians-8ead2.firebaseapp.com",
    projectId: "bangla-victorians-8ead2",
    storageBucket: "bangla-victorians-8ead2.firebasestorage.app",
    messagingSenderId: "628248840218",
    appId: "1:628248840218:web:f8d29e0fe290dd8c16a9a3",
    measurementId: "G-6LW2QF4SLH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Data Arrays for Popups
let players = [];
let newsArr = [];
let galleryArr =[];

// Share Function (Web Share API)
window.shareContent = async (title, text, url) => {
    if (navigator.share) {
        try {
            await navigator.share({ title: title, text: text, url: url });
        } catch (err) {
            console.log('Share canceled or failed', err);
        }
    } else {
        // Fallback: Copy to clipboard if not supported
        navigator.clipboard.writeText(`${title}\n${text}\nLink: ${url}`);
        alert("Link copied to clipboard! You can paste and share it anywhere.");
    }
}

// UI Triggers
window.toggleMobile = () => { const m=document.getElementById('mobile-nav'); m.style.display=m.style.display==='block'?'none':'block'; }
window.toggleLogin = () => { const m=document.getElementById('login-modal'); m.style.display=m.style.display==='flex'?'none':'flex'; }
window.toggleSponsor = () => { const m=document.getElementById('sponsor-modal'); m.style.display=m.style.display==='flex'?'none':'flex'; }
window.tab = (id) => { document.querySelectorAll('.adm-section').forEach(e=>e.classList.remove('active')); document.getElementById(id).classList.add('active'); }

// Load Settings
async function loadConfig() {
    const snap = await getDoc(doc(db,"settings","config"));
    if(snap.exists()) {
        const d = snap.data();
        const hero = document.getElementById('hero');
        if(d.bg) hero.style.background = d.bg.includes('http') ? `url('${d.bg}')` : d.bg;
        hero.style.backgroundSize = 'cover'; hero.style.backgroundPosition = 'center';
        if(document.getElementById('cfg-bg')) document.getElementById('cfg-bg').value = d.bg;
    }
    const sSnap = await getDoc(doc(db,"settings","stats"));
    if(sSnap.exists()) {
        const s = sSnap.data();
        document.getElementById('stat-rank').innerText = s.rank;
        document.getElementById('stat-matches').innerText = s.matches;
        document.getElementById('stat-win').innerText = s.win;
        document.getElementById('stat-titles').innerText = s.titles;
        if(document.getElementById('cfg-rank')) {
            document.getElementById('cfg-rank').value = s.rank;
            document.getElementById('cfg-matches').value = s.matches;
            document.getElementById('cfg-win').value = s.win;
            document.getElementById('cfg-titles').value = s.titles;
        }
    }
}
window.saveConfig = async () => { const b = document.getElementById('cfg-bg').value; await setDoc(doc(db,"settings","config"), {bg:b}); alert("BG Saved"); loadConfig(); }
window.saveStats = async () => {
    const r=document.getElementById('cfg-rank').value, m=document.getElementById('cfg-matches').value, w=document.getElementById('cfg-win').value, t=document.getElementById('cfg-titles').value;
    await setDoc(doc(db,"settings","stats"), {rank:r, matches:m, win:w, titles:t}); alert("Stats Updated"); loadConfig();
}

window.submitSponsor = async () => {
    const n=document.getElementById('s-name').value, e=document.getElementById('s-email').value, w=document.getElementById('s-wp').value, d=document.getElementById('s-desc').value;
    if(n && w) { await addDoc(collection(db, "sponsors"), {name: n, email: e, whatsapp: w, desc: d, time: Date.now()}); alert("Request Sent! Admin will contact you."); toggleSponsor(); } else { alert("Fill Name & WhatsApp."); }
}

window.login = () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value)
    .then(() => { document.getElementById('user-view').style.display='none'; document.getElementById('admin-view').style.display='block'; toggleLogin(); loadData(); })
    .catch(e=>alert(e.message));
}
window.logout = () => signOut(auth).then(()=>location.reload());
window.goHome = () => { document.getElementById('user-view').style.display='block'; document.getElementById('admin-view').style.display='none'; }

window.savePlayer = async () => {
    const id=document.getElementById('p-id').value;
    const p={ name:document.getElementById('p-name').value, ign:document.getElementById('p-ign').value, role:document.getElementById('p-role').value, uid:document.getElementById('p-uid').value, age:document.getElementById('p-age').value, img:document.getElementById('p-img').value, profile:document.getElementById('p-prof').value, email:document.getElementById('p-email').value, kd:document.getElementById('p-kd').value, win:document.getElementById('p-win').value, desc:document.getElementById('p-desc').value, time:Date.now() };
    if(id) await updateDoc(doc(db,"roster",id), p); else await addDoc(collection(db,"roster"), p);
    alert("Saved"); window.clearP(); loadData();
}
window.clearP = () => {['p-id','p-name','p-ign','p-role','p-uid','p-age','p-img','p-prof','p-email','p-kd','p-win','p-desc'].forEach(i=>document.getElementById(i).value=''); }
window.editP = (id, str) => { const d=JSON.parse(decodeURIComponent(str)); window.clearP(); document.getElementById('p-id').value=id; for(let k in d) if(document.getElementById('p-'+k)) document.getElementById('p-'+k).value=d[k]; }

window.saveNews = async () => {
    const id=document.getElementById('n-id').value, n={ title:document.getElementById('n-title').value, img:document.getElementById('n-img').value, desc:document.getElementById('n-desc').value, date:new Date().toLocaleDateString(), time:Date.now() };
    if(id) await updateDoc(doc(db,"blogs",id), n); else await addDoc(collection(db,"blogs"), n);
    alert("Posted"); loadData();
}
window.saveVideo = async () => {
    const u=document.getElementById('v-url').value, vid=u.split('v=')[1]?.split('&')[0]||u.split('/').pop();
    await addDoc(collection(db,"videos"),{title:document.getElementById('v-title').value, url:`https://www.youtube.com/embed/${vid}`, time:Date.now()});
    alert("Added"); loadData();
}
window.saveImage = async () => { await addDoc(collection(db,"gallery"),{url:document.getElementById('g-url').value, time:Date.now()}); alert("Added"); loadData(); }
window.postComment = async () => { const n=document.getElementById('c-name').value, m=document.getElementById('c-msg').value; if(n&&m){ await addDoc(collection(db,"comments"),{name:n, msg:m, time:Date.now()}); loadData(); document.getElementById('c-msg').value=""; } }
window.delItem = async (c,i) => { if(confirm("Delete?")){ await deleteDoc(doc(db,c,i)); loadData(); } }

async function loadData() {
    // 1. Roster
    const s1=await getDocs(query(collection(db,"roster"), orderBy("time","asc")));
    let h1="", a1=""; players=[];
    s1.forEach(d=>{ const v=d.data(); players.push(v); const i=players.length-1;
        h1+=`<div class="player-card" onclick="openP(${i})">
                <img src="${v.img}" alt="${v.name}" class="p-img">
                <div class="p-info"><span class="p-role">${v.role}</span><h3 class="p-name">${v.name}</h3><div class="p-stats" style="display:flex; justify-content:space-between; margin-top:5px;"><div class="ps-item"><span>K/D: </span><b>${v.kd||'N/A'}</b></div><div class="ps-item"><span>WIN: </span><b>${v.win||'N/A'}</b></div></div></div>
                <div class="view-btn">VIEW DETAILS</div>
             </div>`;
        a1+=`<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333; color:white;"><span>${v.name}</span><div><button onclick="editP('${d.id}','${encodeURIComponent(JSON.stringify(v))}')" style="color:var(--primary); background:none; border:none; cursor:pointer;">EDIT</button> <button onclick="delItem('roster','${d.id}')" style="color:red; background:none; border:none; cursor:pointer;">DEL</button></div></div>`;
    });
    document.getElementById('roster-list').innerHTML=h1; if(document.getElementById('adm-roster')) document.getElementById('adm-roster').innerHTML=a1;

    // 2. News (Updated with Modal support)
    const s2=await getDocs(query(collection(db,"blogs"), orderBy("time","desc")));
    let h2="", a2=""; newsArr=[];
    s2.forEach(d=>{ const v=d.data(); newsArr.push(v); const i=newsArr.length-1;
        h2+=`<div class="vid-card" onclick="openNews(${i})" style="cursor:pointer;">
                <div class="vid-thumb"><img src="${v.img}" style="width:100%;height:100%;object-fit:cover;"></div>
                <div class="vid-info"><div class="vid-meta" style="color:var(--primary); font-size:0.9rem;">${v.date}</div><h4 class="vid-title" style="color:white; margin-top:5px;">${v.title}</h4></div>
            </div>`; 
        a2+=`<div style="padding:10px; color:white; border-bottom:1px solid #222;">${v.title} <button onclick="delItem('blogs','${d.id}')" style="color:red; float:right; background:none; border:none;">DEL</button></div>`; 
    });
    document.getElementById('news-list').innerHTML=h2; if(document.getElementById('adm-news')) document.getElementById('adm-news').innerHTML=a2;

    // 3. Videos (Updated with Share button)
    const s3=await getDocs(query(collection(db,"videos"), orderBy("time","desc")));
    let h3="", a3=""; 
    s3.forEach(d=>{ 
        const v = d.data();
        h3+=`<div class="vid-card">
                <div class="vid-thumb"><iframe src="${v.url}" title="${v.title}" allowfullscreen></iframe></div>
                <div class="vid-info" style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 class="vid-title" style="color:white; font-size:1.1rem;">${v.title}</h4>
                    <button onclick="shareContent('${v.title}', 'Watch this epic gameplay highlight from Bangla Victorians!', '${v.url}')" style="background:var(--primary); color:black; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:1.1rem; transition:0.3s;"><i class="fas fa-share-alt"></i></button>
                </div>
            </div>`; 
        a3+=`<div style="padding:10px; color:white; border-bottom:1px solid #222;">${v.title} <button onclick="delItem('videos','${d.id}')" style="color:red; float:right; background:none; border:none;">DEL</button></div>`; 
    });
    document.getElementById('video-list').innerHTML=h3; if(document.getElementById('adm-video')) document.getElementById('adm-video').innerHTML=a3;

    // 4. Gallery (Updated with Modal support)
    const s4=await getDocs(query(collection(db,"gallery"), orderBy("time","desc")));
    let h4="", a4=""; galleryArr=[];
    s4.forEach(d=>{ const v=d.data(); galleryArr.push(v); const i=galleryArr.length-1;
        h4+=`<img src="${v.url}" class="gal-img" onclick="openGallery(${i})">`; 
        a4+=`<div style="padding:10px; color:white; border-bottom:1px solid #222;">Image <button onclick="delItem('gallery','${d.id}')" style="color:red; float:right; background:none; border:none;">DEL</button></div>`; 
    });
    document.getElementById('gallery-list').innerHTML=h4; if(document.getElementById('adm-gallery')) document.getElementById('adm-gallery').innerHTML=a4;

    // Fans & Sponsors
    const s5=await getDocs(query(collection(db,"comments"), orderBy("time","desc")));
    let h5="", a5=""; s5.forEach(d=>{ h5+=`<div style="border-bottom:1px solid #222; padding:10px;"><strong style="color:var(--primary)">${d.data().name}</strong><p style="color:#aaa; margin-top:5px;">${d.data().msg}</p></div>`; a5+=`<div style="padding:10px; color:white; border-bottom:1px solid #222;">${d.data().name}: ${d.data().msg} <button onclick="delItem('comments','${d.id}')" style="color:red; float:right; background:none; border:none;">DEL</button></div>`; });
    document.getElementById('comm-list').innerHTML=h5; if(document.getElementById('adm-fans')) document.getElementById('adm-fans').innerHTML=a5;

    const s6=await getDocs(query(collection(db,"sponsors"), orderBy("time","desc")));
    let a6=""; s6.forEach(d=>{ const v=d.data(); a6+=`<div style="background:#151515; padding:15px; margin-bottom:10px; border-left:3px solid var(--primary);"><h4 style="color:white; margin:0;">${v.name}</h4><p style="color:#aaa; font-size:0.9rem; margin:5px 0;">${v.desc}</p><small style="color:#666;">${v.email} | ${v.whatsapp}</small> <button onclick="delItem('sponsors','${d.id}')" style="color:red; float:right; background:none; border:none; cursor:pointer;">DEL</button></div>`; });
    if(document.getElementById('adm-sponsors')) document.getElementById('adm-sponsors').innerHTML=a6;
}

// Popup Opens & Share Injections
window.openP = (i) => {
    const p = players[i];
    document.getElementById('pm-img').src=p.img; document.getElementById('pm-prof').src=p.profile||p.img; 
    document.getElementById('pm-name').innerText=p.name; document.getElementById('pm-role').innerText=p.role; 
    document.getElementById('pm-ign').innerText=p.ign; document.getElementById('pm-uid').innerText=p.uid; 
    document.getElementById('pm-age').innerText=p.age; document.getElementById('pm-email').innerText=p.email||'N/A';
    document.getElementById('pm-kd').innerText=p.kd||'N/A'; document.getElementById('pm-win').innerText=p.win||'N/A';
    document.getElementById('pm-desc').innerText=p.desc; 
    
    // Setup Share Button for Player
    document.getElementById('pm-share').onclick = () => {
        shareContent(`Bangla Victorians | ${p.name} (${p.ign})`, `Checkout the awesome profile of ${p.ign}! Role: ${p.role}, Win Rate: ${p.win||'N/A'}.`, window.location.href);
    };
    
    document.getElementById('player-popup').style.display='flex';
}

window.openNews = (i) => {
    const n = newsArr[i];
    document.getElementById('nm-img').src = n.img;
    document.getElementById('nm-date').innerText = n.date;
    document.getElementById('nm-title').innerText = n.title;
    document.getElementById('nm-desc').innerText = n.desc;
    
    // Setup Share Button for News
    document.getElementById('nm-share').onclick = () => {
        shareContent(n.title, n.desc.substring(0, 100) + '...', window.location.href);
    };
    
    document.getElementById('news-popup').style.display = 'flex';
}

window.openGallery = (i) => {
    const g = galleryArr[i];
    document.getElementById('gm-img').src = g.url;
    
    // Setup Share Button for Gallery Image
    document.getElementById('gm-share').onclick = () => {
        shareContent('Bangla Victorians Esports Gallery', 'Check out this awesome photo from our squad!', g.url);
    };
    
    document.getElementById('gallery-popup').style.display = 'flex';
}

loadConfig(); loadData();
