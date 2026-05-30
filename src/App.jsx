import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2SpuTCJyh8b6Y6Kucu72hLR0tTHVLPm8",
  authDomain: "python-vault-481f4.firebaseapp.com",
  projectId: "python-vault-481f4",
  storageBucket: "python-vault-481f4.firebasestorage.app",
  messagingSenderId: "776169684204",
  appId: "1:776169684204:web:e5199182ba7428278979c9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// Fix for mobile browsers blocking sessionStorage
auth.useDeviceLanguage();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const TYPES = [
  { id: "note",       label: "Text Note",    icon: "📝", color: "#5DCAA5" },
  { id: "code",       label: "Code Snippet", icon: "💻", color: "#7F77DD" },
  { id: "screenshot", label: "Screenshot",   icon: "🖼️", color: "#EF9F27" },
  { id: "video",      label: "Video Link",   icon: "🎬", color: "#E24B4A" },
  { id: "course",     label: "Course",       icon: "🎓", color: "#378ADD" },
];

const TAGS = ["basics", "loops", "functions", "OOP", "libraries", "projects", "tips", "errors"];
const typeOf = (id) => TYPES.find((t) => t.id === id) || TYPES[0];
const formatDate = (ts) => new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const S = {
  page:     { minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif", padding: "0 0 60px" },
  header:   { background: "#161b27", borderBottom: "1px solid #2a2f3e", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 },
  logo:     { fontSize: 20, fontWeight: 600, color: "#e2e8f0", margin: 0 },
  sub:      { fontSize: 12, color: "#8892a4", marginTop: 2 },
  body:     { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  card:     { background: "#161b27", border: "1px solid #2a2f3e", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, transition: "border-color 0.15s, transform 0.1s" },
  cardTitle:{ fontWeight: 500, fontSize: 14, margin: 0, color: "#e2e8f0", flex: 1, marginRight: 8 },
  input:    { width: "100%", boxSizing: "border-box", background: "#1e2535", border: "1px solid #2a2f3e", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" },
  textarea: { width: "100%", boxSizing: "border-box", background: "#1e2535", border: "1px solid #2a2f3e", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical" },
  select:   { background: "#1e2535", border: "1px solid #2a2f3e", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" },
  btnGreen: { background: "#5DCAA5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 500, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
  btnGhost: { background: "transparent", border: "1px solid #2a2f3e", borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: "#8892a4", fontSize: 13 },
  btnIcon:  { background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8892a4", fontSize: 15 },
  statCard: { background: "#161b27", border: "1px solid #2a2f3e", borderRadius: 10, padding: "12px 10px", textAlign: "center" },
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal:    { background: "#161b27", border: "1px solid #2a2f3e", borderRadius: 14, padding: "1.5rem", maxWidth: 600, width: "100%", maxHeight: "88vh", overflowY: "auto" },
  label:    { fontSize: 12, color: "#8892a4", marginBottom: 5, display: "block" },
  formBox:  { background: "#161b27", border: "1px solid #2a2f3e", borderRadius: 12, padding: "1.25rem", marginBottom: 20 },
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10, marginBottom: 20 },
};

// ── Login Page ───────────────────────────────────────────────────────────────
function LoginPage() {
  const [step, setStep] = useState("main"); // main | email
  const [emailMode, setEmailMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).then(result => {
      if (result?.user) console.log("Redirect login success:", result.user.email);
    }).catch(e => {
      if (e.code !== "auth/no-current-user") {
        setError(e.message.replace("Firebase: ", "").replace(/\(.*\)/, ""));
      }
    });
  }, []);

  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error("Google login error:", e);
      setError(e.message.replace("Firebase: ", "").replace(/\(.*\)/, ""));
      setLoading(false);
    }
  }

  async function handleEmail() {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      if (emailMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(.*\)/, ""));
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🐍</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#e2e8f0", margin: "0 0 6px" }}>Python Vault</h1>
          <p style={{ fontSize: 14, color: "#8892a4", margin: 0 }}>Your personal Python learning space</p>
        </div>

        <div style={{ background: "#161b27", border: "1px solid #2a2f3e", borderRadius: 16, padding: "1.5rem" }}>

          {step === "main" && (
            <>
              {/* Google Button */}
              <button onClick={handleGoogle} disabled={loading} style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                border: "1px solid #2a2f3e", background: "#1e2535",
                color: "#e2e8f0", fontSize: 15, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                marginBottom: 16, opacity: loading ? 0.7 : 1, transition: "background 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#253045"}
                onMouseLeave={e => e.currentTarget.style.background = "#1e2535"}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "#2a2f3e" }} />
                <span style={{ fontSize: 12, color: "#8892a4", letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#2a2f3e" }} />
              </div>

              {/* Email input + Continue */}
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                type="email" style={{ ...S.input, marginBottom: 10, borderRadius: 10, padding: "12px 14px", fontSize: 14 }} />
              <button onClick={() => { if (email) setStep("email"); else setError("Please enter your email"); }}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10, border: "none",
                  background: "#e2e8f0", color: "#0f1117", fontSize: 15, fontWeight: 500, cursor: "pointer"
                }}>
                Continue with email
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <button onClick={() => { setStep("main"); setError(""); }} style={{ ...S.btnIcon, marginBottom: 12, fontSize: 18, color: "#8892a4" }}>← Back</button>
              <p style={{ fontSize: 13, color: "#8892a4", margin: "0 0 14px" }}>{email}</p>

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["login", "register"].map(m => (
                  <button key={m} onClick={() => setEmailMode(m)} style={{
                    flex: 1, padding: "7px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    background: emailMode === m ? "#5DCAA5" : "#1e2535",
                    color: emailMode === m ? "#fff" : "#8892a4"
                  }}>{m === "login" ? "Login" : "Register"}</button>
                ))}
              </div>

              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                type="password" style={{ ...S.input, marginBottom: 10, borderRadius: 10, padding: "12px 14px", fontSize: 14 }}
                onKeyDown={e => e.key === "Enter" && handleEmail()} />

              <button onClick={handleEmail} disabled={loading} style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: "#5DCAA5", color: "#fff", fontSize: 15, fontWeight: 500,
                cursor: "pointer", opacity: loading ? 0.7 : 1
              }}>
                {loading ? "Please wait..." : emailMode === "login" ? "🔓 Login" : "✅ Create Account"}
              </button>
            </>
          )}

          {error && <p style={{ fontSize: 12, color: "#E24B4A", margin: "12px 0 0", background: "#E24B4A11", padding: "8px 12px", borderRadius: 6 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}


function Badge({ tag }) {
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#1e2535", border: "1px solid #2a2f3e", color: "#8892a4", fontFamily: "monospace" }}>{tag}</span>;
}

function TypeChip({ type }) {
  const t = typeOf(type);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 10px", borderRadius: 20, background: t.color + "22", color: t.color, border: `1px solid ${t.color}55`, fontWeight: 500 }}>
      {t.icon} {t.label}
    </span>
  );
}

function EntryCard({ entry, onDelete, onView }) {
  const t = typeOf(entry.type);
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onView(entry)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...S.card, borderLeft: `3px solid ${t.color}`, borderColor: hovered ? t.color : "#2a2f3e", transform: hovered ? "translateY(-1px)" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={S.cardTitle}>{entry.title}</p>
        <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={S.btnIcon}>🗑️</button>
      </div>
      <TypeChip type={entry.type} />
      {entry.type === "screenshot" && entry.imageData && (
        <img src={entry.imageData} alt={entry.title} style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 6 }} />
      )}
      {entry.type !== "screenshot" && entry.content && (
        <p style={{ fontSize: 13, color: "#8892a4", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{entry.content}</p>
      )}
      {entry.tags?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{entry.tags.map(tag => <Badge key={tag} tag={tag} />)}</div>}
      <p style={{ fontSize: 11, color: "#4a5568", margin: 0 }}>{formatDate(entry.createdAt)}</p>
    </div>
  );
}

function TagPicker({ selected, onChange }) {
  return (
    <div>
      <label style={S.label}>Tags</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TAGS.map(tag => {
          const on = selected.includes(tag);
          return <button key={tag} onClick={() => onChange(tag)} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "monospace", background: on ? "#5DCAA522" : "transparent", color: on ? "#5DCAA5" : "#8892a4", border: on ? "1px solid #5DCAA5" : "1px solid #2a2f3e" }}>{tag}</button>;
        })}
      </div>
    </div>
  );
}

function ContentField({ type, value, onChange, imageData, onImageChange }) {
  const fileRef = useRef();
  if (type === "screenshot") return (
    <div style={{ marginBottom: 8 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader(); r.onload = () => onImageChange(r.result); r.readAsDataURL(f);
      }} style={{ display: "none" }} />
      <button onClick={() => fileRef.current.click()} style={{ ...S.btnGhost, marginBottom: 8 }}>📁 {imageData ? "Replace image" : "Upload image"}</button>
      {imageData && <img src={imageData} alt="preview" style={{ display: "block", maxHeight: 140, borderRadius: 6, objectFit: "cover" }} />}
    </div>
  );
  if (type === "code") return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Paste your Python code here..." style={{ ...S.textarea, minHeight: 120, fontFamily: "monospace", fontSize: 13, marginBottom: 8 }} />;
  if (type === "video") return <input value={value} onChange={e => onChange(e.target.value)} placeholder="YouTube / video URL" style={{ ...S.input, marginBottom: 8 }} />;
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={type === "course" ? "Course name, source, what you learned..." : "Write your notes here..."} style={{ ...S.textarea, minHeight: 100, marginBottom: 8 }} />;
}

function Modal({ entry, onClose, onSave }) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content || "");
  const [imageData, setImageData] = useState(entry.imageData || null);
  const [tags, setTags] = useState(entry.tags || []);
  const [saving, setSaving] = useState(false);
  const t = typeOf(entry.type);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ ...entry, title: title.trim(), content: content.trim(), imageData, tags });
    setSaving(false);
    onClose();
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <TypeChip type={entry.type} />
          <button onClick={onClose} style={S.btnIcon}>✕</button>
        </div>
        <label style={S.label}>Title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...S.input, marginBottom: 10 }} />
        <label style={S.label}>Content</label>
        <ContentField type={entry.type} value={content} onChange={setContent} imageData={imageData} onImageChange={setImageData} />
        <TagPicker selected={tags} onChange={tag => setTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag])} />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btnGreen, background: t.color, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "💾 Save changes"}
          </button>
          <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AddForm({ onSave, onCancel, defaultType = "note" }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageData, setImageData] = useState(null);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const t = typeOf(defaultType);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ type: defaultType, title: title.trim(), content: content.trim(), imageData, tags, createdAt: Date.now() });
    setSaving(false);
  }

  return (
    <div style={S.formBox}>
      <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 14px", color: "#e2e8f0" }}>➕ Add {t.label}</p>
      <label style={S.label}>Title *</label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your entry a title..." style={{ ...S.input, marginBottom: 10 }} />
      <label style={S.label}>Content</label>
      <ContentField type={defaultType} value={content} onChange={setContent} imageData={imageData} onImageChange={setImageData} />
      <TagPicker selected={tags} onChange={tag => setTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag])} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btnGreen, background: t.color, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "💾 Save entry"}
        </button>
        <button onClick={onCancel} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("Auth state changed:", u?.email);
      setUser(u);
      setAuthLoading(false);
      if (u) {
        await loadEntries(u.uid);
      } else {
        setEntries([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function loadEntries(uid) {
    setLoading(true);
    try {
      const q = query(collection(db, "entries"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setEntries(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleAdd(entry) {
    try {
      const docRef = await addDoc(collection(db, "entries"), { ...entry, uid: user.uid });
      setEntries(prev => [{ id: docRef.id, ...entry, uid: user.uid }, ...prev]);
      setShowForm(false);
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, "entries", id));
      setEntries(prev => prev.filter(e => e.id !== id));
      if (viewEntry?.id === id) setViewEntry(null);
    } catch (e) { console.error(e); }
  }

  async function handleEditSave(updated) {
    try {
      const { id, ...data } = updated;
      await updateDoc(doc(db, "entries", id), data);
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
    } catch (e) { console.error(e); }
  }

  function handleStatClick(typeId) {
    if (viewEntry) return;
    setFilterType(prev => prev === typeId ? "all" : typeId);
    setShowForm(false);
  }

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#8892a4" }}>Loading... ☁️</p>
    </div>
  );

  if (!user) return <LoginPage />;

  const filtered = entries.filter(e => {
    const matchType = filterType === "all" || e.type === filterType;
    const q = search.toLowerCase();
    return matchType && (!q || e.title.toLowerCase().includes(q) || (e.content || "").toLowerCase().includes(q) || e.tags?.some(t => t.includes(q)));
  });

  const counts = TYPES.reduce((acc, t) => { acc[t.id] = entries.filter(e => e.type === t.id).length; return acc; }, {});

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.logo}>🐍 Python Vault</h1>
          <p style={S.sub}>{entries.length} entries · ☁️ {user.displayName || user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowForm(v => !v)} style={S.btnGreen}>
            {showForm ? "✕ Close" : "➕ Add entry"}
          </button>
          <button onClick={() => signOut(auth)} style={{ ...S.btnGhost, fontSize: 12 }}>🚪 Logout</button>
        </div>
      </div>

      <div style={S.body}>
        {loading ? (
          <p style={{ color: "#8892a4", textAlign: "center", padding: "2rem" }}>Loading your vault... ☁️</p>
        ) : (
          <>
            <div style={S.statsRow}>
              {TYPES.map(t => {
                const active = filterType === t.id;
                return (
                  <div key={t.id} onClick={() => handleStatClick(t.id)} style={{
                    ...S.statCard, cursor: "pointer", transition: "all 0.15s",
                    border: active ? `1px solid ${t.color}` : "1px solid #2a2f3e",
                    background: active ? t.color + "18" : "#161b27",
                    transform: active ? "translateY(-2px)" : "none",
                    opacity: viewEntry ? 0.5 : 1,
                  }}>
                    <div style={{ fontSize: 22 }}>{t.icon}</div>
                    <p style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 0", color: t.color }}>{counts[t.id] || 0}</p>
                    <p style={{ fontSize: 10, color: active ? t.color : "#8892a4", margin: 0, fontWeight: active ? 600 : 400 }}>{t.label}</p>
                  </div>
                );
              })}
            </div>

            {showForm && <AddForm key={filterType} onSave={handleAdd} onCancel={() => setShowForm(false)} defaultType={filterType !== "all" ? filterType : "note"} />}

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search entries..." style={{ ...S.input, flex: 1, minWidth: 140 }} />
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setShowForm(false); }} style={S.select}>
                <option value="all">All types</option>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#4a5568" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <p style={{ fontSize: 14, margin: "0 0 16px" }}>{entries.length === 0 ? "Your vault is empty — add your first entry!" : `No ${filterType !== "all" ? typeOf(filterType).label : ""} entries yet.`}</p>
                <button onClick={() => setShowForm(true)} style={{ ...S.btnGreen, background: filterType !== "all" ? typeOf(filterType).color : "#5DCAA5", margin: "0 auto" }}>
                  ➕ Add {filterType !== "all" ? typeOf(filterType).label : "entry"}
                </button>
              </div>
            ) : (
              <div style={S.grid}>
                {filtered.map(entry => <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} onView={setViewEntry} />)}
              </div>
            )}
          </>
        )}
      </div>

      {viewEntry && <Modal entry={viewEntry} onClose={() => setViewEntry(null)} onSave={handleEditSave} />}
    </div>
  );
}
