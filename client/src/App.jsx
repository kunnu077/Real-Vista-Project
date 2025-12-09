import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || "admin123";

const fetchList = async (path) => {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.error(`Failed to fetch ${path}:`, res.status, res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error(`Network error fetching ${path}:`, error.message);
    return [];
  }
};

const loadAll = async ({ setProjects, setClients, setContacts, setSubscribers }) => {
  const [projects, clients, contacts, subscribers] = await Promise.all([
    fetchList("/api/projects"),
    fetchList("/api/clients"),
    fetchList("/api/contacts"),
    fetchList("/api/subscribers"),
  ]);
  setProjects(projects);
  setClients(clients);
  setContacts(contacts);
  setSubscribers(subscribers);
};

function App() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [contactForm, setContactForm] = useState({ fullName: "", email: "", phone: "", city: "" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", image: "" });
  const [clientForm, setClientForm] = useState({ name: "", designation: "", description: "", image: "" });
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [status, setStatus] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ id: "", pass: "" });
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("dashboard");
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    // Check backend connection
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        setBackendConnected(res.ok);
      } catch (error) {
        setBackendConnected(false);
        console.warn("Backend not connected:", error.message);
      }
    };
    checkConnection();
    loadAll({ setProjects, setClients, setContacts, setSubscribers });
    
    // Check connection periodically
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminOpen && adminAuthed) {
      loadAll({ setProjects, setClients, setContacts, setSubscribers });
    }
  }, [adminOpen, adminAuthed]);

  // Scroll to section smoothly
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle Book a Call - scroll to contact form
  const handleBookCall = () => {
    scrollToSection("contact");
  };

  // Handle Explore Services - scroll to services
  const handleExploreServices = () => {
    scrollToSection("services");
  };

  // Handle Learn More - scroll to projects
  const handleLearnMore = () => {
    scrollToSection("projects");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    
    // Validate form
    if (!contactForm.fullName || !contactForm.email || !contactForm.phone || !contactForm.city) {
      setStatus("Please fill all fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setContactForm({ fullName: "", email: "", phone: "", city: "" });
        // Refresh all data including contacts
        await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        setStatus("✅ Thanks for reaching out! We will connect soon.");
        
        // If admin panel is open and authenticated, refresh it
        if (adminOpen && adminAuthed) {
          await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        }
      } else {
        setStatus(`❌ ${data.message || "Failed to submit. Please try again."}`);
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setStatus("❌ Failed to submit. Please check your connection and try again.");
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
      if (res.ok) {
        setSubscriberEmail("");
        await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        setStatus("Subscribed.");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(data.message || "Enter a valid email.");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      setStatus("Failed to subscribe. Please check your connection and try again.");
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setAdminStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectForm),
      });
      if (res.ok) {
        setProjectForm({ name: "", description: "", image: "" });
        await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        setAdminStatus("Project saved.");
      } else {
        const data = await res.json().catch(() => ({}));
        setAdminStatus(data.message || "All project fields are required.");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      setAdminStatus("Failed to save project. Please check your connection and try again.");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        setAdminStatus('Project deleted.');
      } else {
        const data = await res.json().catch(() => ({}));
        setAdminStatus(data.message || 'Failed to delete project.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setAdminStatus('Failed to delete project. Please try again.');
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setAdminStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });
      if (res.ok) {
        setClientForm({ name: "", designation: "", description: "", image: "" });
        await loadAll({ setProjects, setClients, setContacts, setSubscribers });
        setAdminStatus("Client saved.");
      } else {
        const data = await res.json().catch(() => ({}));
        setAdminStatus(data.message || "All client fields are required.");
      }
    } catch (error) {
      console.error("Error submitting client:", error);
      setAdminStatus("Failed to save client. Please check your connection and try again.");
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="nav">
          <div className="logo">Real Vista</div>
          <div className="menu">
            <a href="#services">Services</a>
            <a href="#projects">Projects</a>
            <a href="#clients">Clients</a>
            <a href="#contact">Contact</a>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ 
                fontSize: "10px", 
                color: backendConnected ? "#4ade80" : "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span style={{ 
                  width: "6px", 
                  height: "6px", 
                  borderRadius: "50%", 
                  backgroundColor: backendConnected ? "#4ade80" : "#f87171",
                  display: "inline-block"
                }}></span>
                {backendConnected ? "Connected" : "Disconnected"}
              </span>
              <button className="btn ghost tiny" onClick={() => setAdminOpen(true)}>
                Admin Login
              </button>
            </div>
          </div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <p className="eyebrow">Consultation. Design. Marketing.</p>
            <h1>Make your listing shine and sell faster.</h1>
            <p className="subtitle">Strategy, staging, and outreach crafted for modern buyers.</p>
            <div className="hero-cta">
              <button className="btn primary" onClick={handleExploreServices}>Explore Services</button>
              <button className="btn ghost" onClick={handleLearnMore}>Learn More</button>
            </div>
          </div>
          <div className="card glass" id="contact">
            <div className="card-badge">Limited Slots</div>
            <div className="card-title big">Get a Free Consultation</div>
            <p className="card-sub">Share your details and we will call you within 24 hours.</p>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <input placeholder="Full Name" value={contactForm.fullName} onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })} />
              <input placeholder="Email Address" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              <input placeholder="Mobile Number" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              <input placeholder="City" value={contactForm.city} onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })} />
              <button className="btn full primary">Get Quick Quote</button>
            </form>
            {status && <div className="status">{status}</div>}
          </div>
        </div>
      </header>

      <section className="section light" id="services">
        <div className="section-header">
          <h2>Not Your Average Realtor</h2>
          <p>We pair design-first staging with smart marketing to bring qualified buyers sooner.</p>
        </div>
        <div className="pill-row">
          <div className="pill">
            <div className="pill-icon">🎯</div>
            <div>
              <div className="pill-title">Potential ROI</div>
              <div className="pill-text">Upfront insights on pricing and upgrades.</div>
            </div>
          </div>
          <div className="pill">
            <div className="pill-icon">🎨</div>
            <div>
              <div className="pill-title">Design</div>
              <div className="pill-text">Clean palettes, fresh staging, lifestyle visuals.</div>
            </div>
          </div>
          <div className="pill">
            <div className="pill-icon">📣</div>
            <div>
              <div className="pill-title">Marketing</div>
              <div className="pill-text">Targeted outreach with cross channel campaigns.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section neon" id="projects">
        <div className="section-header">
          <p className="section-sub">What we have shipped</p>
          <h2 className="title-glow">Our Projects</h2>
          <p>Design-forward launches that bring more buyers to the table.</p>
        </div>
        <div className="grid project-grid">
          {projects.map((p) => (
            <div className="card project-card neon-card" key={p._id}>
              <div className="image-wrap">
                <img src={p.image} alt={p.name} />
              </div>
              <div className="card-body">
                <div className="project-title">{p.name}</div>
                <div className="project-desc">Project Name, Location</div>
                <button className="btn tiny outline" onClick={() => scrollToSection("contact")}>Read More</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section neon dark" id="clients">
        <div className="section-header">
          <p className="section-sub">Trusted voices</p>
          <h2 className="title-glow">Happy Clients</h2>
          <p>Stories from partners who trusted the process.</p>
        </div>
        <div className="grid testimonials">
          {clients.map((c) => (
            <div className="card testimonial-card neon-card" key={c._id}>
              <div className="client-top">
                <img src={c.image} alt={c.name} />
                <div>
                  <div className="client-name">{c.name}</div>
                  <div className="client-role">{c.designation}</div>
                </div>
              </div>
              <div className="client-quote">“{c.description}”</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section newsletter">
        <div className="newsletter-box">
          <div>
            <h3>Subscribe for Market Notes</h3>
            <p>Get trends, design tips, and launch checklists in your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input placeholder="Enter Email" value={subscriberEmail} onChange={(e) => setSubscriberEmail(e.target.value)} />
            <button className="btn primary">Subscribe</button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-row">
          <div>
            <div className="logo">Real Vista</div>
            <p>Listing-ready strategies with design and marketing built in.</p>
          </div>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#projects">Projects</a>
            <a href="#clients">Clients</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-cta">
            <div>Ready to move forward?</div>
            <button className="btn primary" onClick={handleBookCall}>Book a Call</button>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Real Vista</div>
      </footer>

      {adminOpen && (
        <div className="modal-backdrop" onClick={() => setAdminOpen(false)}>
          <div className="modal-card admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Admin Panel</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  className="btn ghost tiny" 
                  onClick={() => loadAll({ setProjects, setClients, setContacts, setSubscribers })}
                  title="Refresh Data"
                >
                  🔄 Refresh
                </button>
                <button className="btn ghost tiny" onClick={() => { setAdminOpen(false); setAdminAuthed(false); }}>
                  Close
                </button>
              </div>
            </div>
            {!adminAuthed ? (
              <div className="admin-login">
                <form
                  className="stack"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (adminCreds.id === ADMIN_ID && adminCreds.pass === ADMIN_PASS) {
                      setAdminAuthed(true);
                      setAdminStatus("");
                      setAdminTab("dashboard");
                      // Load all data immediately after login
                      await loadAll({ setProjects, setClients, setContacts, setSubscribers });
                    } else {
                      setAdminStatus("Invalid credentials");
                    }
                  }}
                >
                  <input placeholder="Admin ID" value={adminCreds.id} onChange={(e) => setAdminCreds({ ...adminCreds, id: e.target.value })} />
                  <input placeholder="Password" type="password" value={adminCreds.pass} onChange={(e) => setAdminCreds({ ...adminCreds, pass: e.target.value })} />
                  <button className="btn primary full">Login</button>
                </form>
                {adminStatus && <div className="status">{adminStatus}</div>}
              </div>
            ) : (
              <div className="admin-modal-body">
                <aside className="admin-side">
                  <div className="side-title">Admin</div>
                  <nav className="side-nav">
                    <button className={`side-link ${adminTab === 'dashboard' ? 'active' : ''}`} onClick={() => setAdminTab('dashboard')}>Dashboard</button>
                    <button className={`side-link ${adminTab === 'clients' ? 'active' : ''}`} onClick={() => setAdminTab('clients')}>Clients</button>
                    <button className={`side-link ${adminTab === 'projects' ? 'active' : ''}`} onClick={() => setAdminTab('projects')}>Projects</button>
                    <button className={`side-link ${adminTab === 'subscribers' ? 'active' : ''}`} onClick={() => setAdminTab('subscribers')}>Subscribers</button>
                  </nav>
                  <button
                    className="btn ghost tiny admin-btn"
                    onClick={() => {
                      // Logout: clear auth, close admin modal, reset creds/tab
                      setAdminAuthed(false);
                      setAdminOpen(false);
                      setAdminCreds({ id: "", pass: "" });
                      setAdminTab("dashboard");
                      setAdminStatus("");
                    }}
                  >
                    Logout
                  </button>
                </aside>
                <main className="admin-main">
                  {adminTab === 'dashboard' && (
                    <div className="dashboard-grid">
                      <div className="card stat">
                        <div className="card-title">Projects</div>
                        <div className="stat-value">{projects.length}</div>
                      </div>
                      <div className="card stat">
                        <div className="card-title">Clients</div>
                        <div className="stat-value">{clients.length}</div>
                      </div>
                      <div className="card stat">
                        <div className="card-title">Contacts</div>
                        <div className="stat-value">{contacts.length}</div>
                      </div>
                      <div className="card stat">
                        <div className="card-title">Subscribers</div>
                        <div className="stat-value">{subscribers.length}</div>
                      </div>
                    </div>
                  )}

                  {adminTab === 'projects' && (
                    <div className="stack">
                      <div className="card">
                        <div className="card-title">Add Project</div>
                        <form className="stack" onSubmit={handleProjectSubmit}>
                          <input placeholder="Project Name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                          <input placeholder="Project Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                          <input placeholder="Project Image URL" value={projectForm.image} onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })} />
                          <button className="btn primary full">Save Project</button>
                        </form>
                      </div>
                      <div className="card table-card">
                        <div className="card-title">Existing Projects</div>
                        <div className="table-body">
                          {projects.length === 0 ? (
                            <div style={{ padding: '1rem', color: '#9ca3af' }}>No projects yet</div>
                          ) : (
                            projects.map((p) => (
                              <div key={p._id} className="table-row">
                                <span>{p.name}</span>
                                <span>{p.description?.slice(0, 60)}</span>
                                <span colSpan={1}><img src={p.image} alt={p.name} style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: 6 }} /></span>
                                <span style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button className="btn outline tiny" onClick={() => scrollToSection('contact')}>Read</button>
                                  <button className="btn danger tiny" onClick={() => deleteProject(p._id)}>Delete</button>
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {adminTab === 'clients' && (
                    <div className="stack">
                      <div className="card">
                        <div className="card-title">Add Client</div>
                        <form className="stack" onSubmit={handleClientSubmit}>
                          <input placeholder="Client Name" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
                          <input placeholder="Designation" value={clientForm.designation} onChange={(e) => setClientForm({ ...clientForm, designation: e.target.value })} />
                          <input placeholder="Client Description" value={clientForm.description} onChange={(e) => setClientForm({ ...clientForm, description: e.target.value })} />
                          <input placeholder="Client Image URL" value={clientForm.image} onChange={(e) => setClientForm({ ...clientForm, image: e.target.value })} />
                          <button className="btn primary full">Save Client</button>
                        </form>
                      </div>
                      <div className="card table-card">
                        <div className="card-title">Clients</div>
                        <div className="table-body">
                          {clients.length === 0 ? <div style={{ padding: '1rem', color: '#9ca3af' }}>No clients yet</div> : clients.map(c => (
                            <div key={c._id} className="table-row">
                              <span>{c.name}</span>
                              <span>{c.designation}</span>
                              <span colSpan={2}>{c.description?.slice(0, 80)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {adminTab === 'subscribers' && (
                    <div className="card table-card">
                      <div className="card-title">Subscribed Emails ({subscribers.length})</div>
                      <div className="table">
                        <div className="table-head two">
                          <span>Email</span>
                          <span>Date</span>
                        </div>
                        <div className="table-body">
                          {subscribers.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                              No subscribers yet
                            </div>
                          ) : (
                            subscribers.map((s) => (
                              <div className="table-row two" key={s._id}>
                                <span>{s.email}</span>
                                <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {adminStatus && <div className="status center">{adminStatus}</div>}
                </main>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
