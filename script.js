import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

// Initialize Quill Editors for News and Tips
const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['clean']
];
const quillNews = new Quill('#n-desc-editor', { theme: 'snow', modules: { toolbar: toolbarOptions }});
const quillTips = new Quill('#t-desc-editor', { theme: 'snow', modules: { toolbar: toolbarOptions }});

// UI Triggers
window.toggleLogin = () => { const m=document.getElementById('login-modal'); m.style.display=m.style.display==='flex'?'none':'flex'; }
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
    if(p === 'n') quillNews.root.innerHTML = "";
    if(p === 't') quillTips.root.innerHTML = "";
    if(p === 'n' || p === 't' || p === 'a' || p === 'p') {
        const btn = document.getElementById(p+'-btn');
        if(btn) btn.innerText = "SAVE DATA";
    }
}

// Auth
window.login = () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value)
    .then(() => { document.getElementById('user-view').style.display='none'; document.getElementById('admin-view').style.display='block'; toggleLogin(); loadData(); loadConfig(); })
    .catch(e => alert("Login Failed: " + e.message));
}
window.logout = () => signOut(auth).then(()=>location.reload());

// Settings
async function loadConfig() {
    const s = await getDoc(doc(db,"settings","stats"));
    if(s.exists()) {
        const d = s.data();
        ['rank','matches','win','titles'].forEach(k => {
            if(document.getElementById('stat-'+k)) document.getElementById('stat-'+k).innerText = d[k];
            if(document.getElementById('cfg-'+k)) document.getElementById('cfg-'+k).value = d[k];
        });
    }
    const soc = await getDoc(doc(db,"settings","social"));
    if(soc.exists()) {
        const d = soc.data();
        if(document.getElementById('link-fb')) document.getElementById('link-fb').href = d.fb || '#';
        if(document.getElementById('link-yt')) document.getElementById('link-yt').href = d.yt || '#';
        if(document.getElementById('link-ig')) document.getElementById('link-ig').href = d.ig || '#';
        if(document.getElementById('cfg-fb')) { document.getElementById('cfg-fb').value = d.fb || ''; document.getElementById('cfg-yt').value = d.yt || ''; document.getElementById('cfg-ig').value = d.ig || ''; }
    }
}
window.saveStats = async () => { await setDoc(doc(db,"settings","stats"), { rank:document.getElementById('cfg-rank').value, matches:document.getElementById('cfg-matches').value, win:document.getElementById('cfg-win').value, titles:document.getElementById('cfg-titles').value }); alert("Stats Updated!"); loadConfig(); }
window.saveSocial = async () => { await setDoc(doc(db,"settings","social"), { fb:document.getElementById('cfg-fb').value, yt:document.getElementById('cfg-yt').value, ig:document.getElementById('cfg-ig').value }); alert("Social Links Updated!"); loadConfig(); }

// General CRUD
window.delItem = async (col, id) => { if(confirm("Delete this?")) { await deleteDoc(doc(db, col, id)); loadData(); } }
window.prepareEdit = (prefix, id, dataStr) => {
    const d = JSON.parse(decodeURIComponent(dataStr)); document.getElementById(prefix+'-id').value = id;
    for(let key in d) { if(document.getElementById(prefix+'-'+key)) document.getElementById(prefix+'-'+key).value = d[key]; }
    
    // Set HTML for Rich Text Editor
    if(prefix === 'n') quillNews.root.innerHTML = d.desc || '';
    if(prefix === 't') quillTips.root.innerHTML = d.desc || '';
    
    const btn = document.getElementById(prefix+'-btn');
    if(btn) btn.innerText = "UPDATE DATA";
}

// Saves
window.savePlayer = async () => {
    const id = document.getElementById('p-id').value;
    const p = { name:document.getElementById('p-name').value, ign:document.getElementById('p-ign').value, role:document.getElementById('p-role').value, uid:document.getElementById('p-uid').value, age:document.getElementById('p-age').value, img:document.getElementById('p-img').value, kd:document.getElementById('p-kd').value, win:document.getElementById('p-win').value, desc:document.getElementById('p-desc').value, time:Date.now() };
    if(id) await updateDoc(doc(db,"roster",id), p); else await addDoc(collection(db,"roster"), p);
    alert("Saved!"); clearForm('p'); loadData();
}
window.saveStaff = async () => {
    const id = document.getElementById('s-id').value;
    const s = { name:document.getElementById('s-name').value, role:document.getElementById('s-role').value, img:document.getElementById('s-img').value, time:Date.now() };
    if(id) await updateDoc(doc(db,"staff",id), s); else await addDoc(collection(db,"staff"), s);
    alert("Staff Saved!"); clearForm('s'); loadData();
}
window.saveTrophy = async () => {
    const id = document.getElementById('a-id').value;
    const t = { title:document.getElementById('a-title').value, year:document.getElementById('a-year').value, img:document.getElementById('a-img').value, desc:document.getElementById('a-desc').value, time:Date.now() };
    if(id) await updateDoc(doc(db,"achievements",id), t); else await addDoc(collection(db,"achievements"), t);
    alert("Trophy Added!"); clearForm('a'); loadData();
}
window.saveNews = async () => {
    const id = document.getElementById('n-id').value;
    // Get HTML content directly from Quill Editor
    const htmlDesc = quillNews.root.innerHTML; 
    const n = { title:document.getElementById('n-title').value, img:document.getElementById('n-img').value, desc:htmlDesc, date:new Date().toLocaleDateString(), time:Date.now() };
    if(id) await updateDoc(doc(db,"blogs",id), n); else await addDoc(collection(db,"blogs"), n);
    alert("News Published!"); clearForm('n'); loadData();
}
window.saveTip = async () => {
    const id = document.getElementById('t-id').value;
    const htmlDesc = quillTips.root.innerHTML;
    const t = { title:document.getElementById('t-title').value, img:document.getElementById('t-img').value, desc:htmlDesc, date:new Date().toLocaleDateString(), time:Date.now() };
    if(id) await updateDoc(doc(db,"tips",id), t); else await addDoc(collection(db,"tips"), t);
    alert("Tip Published!"); clearForm('t'); loadData();
}
window.saveSponsorLogo = async () => { await addDoc(collection(db,"sponsors_logos"), {url:document.getElementById('sp-url').value, time:Date.now()}); document.getElementById('sp-url').value=""; loadData(); }

// Render Data
async function loadData() {
    let dash = {ros:0, ach:0, new:0, tip:0};

    // Roster
    const s1 = await getDocs(query(collection(db,"roster"), orderBy("time","asc")));
    let h1="", a1=""; s1.forEach(d => { dash.ros++; const v = d.data();
        h1 += `<a href="details.html?type=roster&id=${slugify(v.ign)}" class="player-card"><img src="${v.img}" class="p-img"><div class="p-info"><span class="p-role">${v.role}</span><h3 class="p-name">${v.ign}</h3></div></a>`;
        a1 += `<div class="adm-item"><span>${v.ign}</span><div><button onclick="prepareEdit('p','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('roster','${d.id}')" style="background:red;">DEL</button></div></div>`;
    });
    if(document.getElementById('roster-list')) document.getElementById('roster-list').innerHTML = h1;
    if(document.getElementById('adm-roster')) document.getElementById('adm-roster').innerHTML = a1;

    // Staff
    const s2 = await getDocs(query(collection(db,"staff"), orderBy("time","asc")));
    let h2="", a2=""; s2.forEach(d => { const v = d.data();
        h2 += `<div class="player-card staff-card"><img src="${v.img}" class="p-img"><div class="p-info"><span class="p-role">${v.role}</span><h3 class="p-name">${v.name}</h3></div></div>`;
        a2 += `<div class="adm-item"><span>${v.name}</span><div><button onclick="prepareEdit('s','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('staff','${d.id}')" style="background:red;">DEL</button></div></div>`;
    });
    if(document.getElementById('staff-list')) document.getElementById('staff-list').innerHTML = h2;
    if(document.getElementById('adm-staff')) document.getElementById('adm-staff').innerHTML = a2;

    // Trophies
    const sAch = await getDocs(query(collection(db,"achievements"), orderBy("time","asc")));
    let hAch="", aAch=""; sAch.forEach(d => { dash.ach++; const v = d.data();
        hAch += `<div class="trophy-card"><img src="${v.img}" class="trophy-img"><span class="trophy-year">${v.year}</span><h3 class="trophy-title">${v.title}</h3><p class="trophy-desc">${v.desc}</p></div>`;
        aAch += `<div class="adm-item"><span>${v.title}</span><div><button onclick="prepareEdit('a','${d.id}','${encodeURIComponent(JSON.stringify(v))}')">EDIT</button><button onclick="delItem('achievements','${d.id}')" style="background:red;">DEL</button></div></div>`;
    });
    if(document.getElementById('trophy-list')) document.getElementById('trophy-list').innerHTML = hAch;
    if(document.getElementById('adm-trophy')) document.getElementById('adm-trophy').innerHTML = aAch;

    // News & Tips
    const s3 = await getDocs(query(collection(db,"blogs"), orderBy("time","desc")));
    let h3="", a3=""; s3.forEach(d => { dash.new++; const v = d.data();
        h3 += `<a href="details.html?type=news&id=${slugify(v.title)}" class="vid-card"><div class="vid-thumb"><img src="${v.img}"></div><div class="vid-info"><div style="color:var(--primary); font-size:0.8rem;">${v.date}</div><span class="vid-title">${v.title}</span></div></a>`;
        a3 += `<div class="adm-item"><span style="font-size:0.9rem;">${v.title}</span><div><button onclick="prepareEdit('n','${d.id}','${encodeURIComponent(JSON.stringify(v))}')" style="font-size:0.8rem; padding:5px;">EDIT</button><button onclick="delItem('blogs','${d.id}')" style="background:red; font-size:0.8rem; padding:5px;">DEL</button></div></div>`;
    });
    if(document.getElementById('news-list')) document.getElementById('news-list').innerHTML = h3;
    if(document.getElementById('adm-news')) document.getElementById('adm-news').innerHTML = a3;

    const s4 = await getDocs(query(collection(db,"tips"), orderBy("time","desc")));
    let h4="", a4=""; s4.forEach(d => { dash.tip++; const v = d.data();
        h4 += `<a href="details.html?type=tips&id=${slugify(v.title)}" class="vid-card"><div class="vid-thumb"><img src="${v.img}"></div><div class="vid-info"><div style="color:var(--primary); font-size:0.8rem;">${v.date}</div><span class="vid-title">${v.title}</span></div></a>`;
        a4 += `<div class="adm-item"><span style="font-size:0.9rem;">${v.title}</span><div><button onclick="prepareEdit('t','${d.id}','${encodeURIComponent(JSON.stringify(v))}')" style="font-size:0.8rem; padding:5px;">EDIT</button><button onclick="delItem('tips','${d.id}')" style="background:red; font-size:0.8rem; padding:5px;">DEL</button></div></div>`;
    });
    if(document.getElementById('tips-list')) document.getElementById('tips-list').innerHTML = h4;
    if(document.getElementById('adm-tips')) document.getElementById('adm-tips').innerHTML = a4;

    // Sponsor Marquee
    const s5 = await getDocs(query(collection(db,"sponsors_logos"), orderBy("time","desc")));
    let h5="", a5=""; s5.forEach(d => { 
        h5 += `<img src="${d.data().url}" class="spon-logo">`;
        a5 += `<div style="position:relative;"><img src="${d.data().url}" style="height:40px; border:1px solid #333;"><i class="fas fa-times" onclick="delItem('sponsors_logos','${d.id}')" style="position:absolute; top:-5px; right:-5px; background:red; padding:3px; border-radius:50%; cursor:pointer;"></i></div>`;
    });
    if(document.getElementById('sponsor-marquee-list')) document.getElementById('sponsor-marquee-list').innerHTML = h5 + h5 + h5;
    if(document.getElementById('adm-sponsors')) document.getElementById('adm-sponsors').innerHTML = a5;

    // Update Dashboard
    if(document.getElementById('dash-ros')) {
        document.getElementById('dash-ros').innerText = dash.ros;
        document.getElementById('dash-ach').innerText = dash.ach;
        document.getElementById('dash-new').innerText = dash.new;
        document.getElementById('dash-tip').innerText = dash.tip;
    }
}

loadConfig(); loadData();
