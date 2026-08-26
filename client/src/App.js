import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import Auth from './Auth';
import AdminDashboard from './AdminDashboard';
import SupportChat from './SupportChat'; 
import SkillRoadmap from './SkillRoadmap'; 
import { sanitizeInput } from './utils/security';
import { calculateATSScore } from './utils/atsEngine';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('student');
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Core Data States
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [announcement, setAnnouncement] = useState('📢 Global Enterprise Placement Automation & Next-Gen AI ATS Matcher Live!');

  // Filter & Search States
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterMinSalary, setFilterMinSalary] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Form States
  const [studentForm, setStudentForm] = useState({ 
    name: '', email: '', dept: 'BCA', cgpa: '', resume_link: '', 
    github_url: '', linkedin_url: '', projects_info: '' 
  });
  const [companyForm, setCompanyForm] = useState({ 
    company_name: '', role: '', package: '', eligibility_cgpa: '', location: 'Chennai', required_skills: '', company_type: 'Product-Based Tier 1'
  });

  // Offer Letter & Admin State
  const [offerLetterFile, setOfferLetterFile] = useState(null);

  // Advanced Tools States
  const [schedule, setSchedule] = useState({ student_id: '', company_name: '', date: '', time: '', mode: 'Online (Google Meet)' });
  const [scheduledList, setScheduledList] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('C++');
  const [selectedCompanyTier, setSelectedCompanyTier] = useState('Product-Based Tier 1');
  const [showAnswers, setShowAnswers] = useState({});

  const API_URL = 'http://localhost:5000/api';

  const mockQuestionsBank = {
    'C++': [
      { q: "What is Virtual Method Table (VTABLE) and how does dynamic dispatch work in C++?", a: "VTABLE is a mechanism used in C++ to support Dynamic Polymorphism. It contains pointers to virtual functions of a class. Each object of a class with virtual functions contains a hidden pointer (vptr) pointing to this table." },
      { q: "Explain Smart Pointers (std::unique_ptr, std::shared_ptr, std::weak_ptr) and memory leak prevention.", a: "Smart pointers manage raw pointer lifetime automatically via RAII. unique_ptr owns exclusively, shared_ptr uses reference counting, and weak_ptr breaks circular references." },
      { q: "How does Move Semantics and rvalue references (&&) optimize resource management?", a: "Move semantics allow transferring ownership of assets/memory from temporary objects (rvalues) without performing expensive deep copy operations." },
      { q: "What is Cache Locality and how do C++ contiguous arrays beat Linked Lists in execution speed?", a: "Contiguous arrays store data sequentially in memory, maximizing CPU Cache L1/L2 hits. Linked lists cause frequent cache misses due to heap pointer chasing." }
    ],
    'SQL': [
      { q: "How do B-Tree and Hash Indexes accelerate query performance in million-record databases?", a: "B-Tree indexes reduce search time complexity from O(N) to O(log N) for range queries. Hash indexes offer O(1) lookup speed for exact equality matches." },
      { q: "Explain ACID properties and how Isolation Levels prevent Dirty Reads & Phantom Reads.", a: "ACID ensures transaction reliability. Isolation levels (Read Committed, Repeatable Read, Serializable) use locks/MVCC to prevent reading uncommitted data." }
    ],
    'AI & Cloud Architecture': [
      { q: "How do Vector Databases (e.g., Pinecone, ChromaDB) enable Large Language Model (LLM) RAG pipelines?", a: "Vector DBs store high-dimensional embeddings and use cosine similarity search to fetch contextual data for LLM prompts in real-time." },
      { q: "What is Microservices Event-Driven Architecture using Apache Kafka or RabbitMQ?", a: "Services communicate asynchronously via event streams, ensuring high decoupled scalability, fault tolerance, and zero lock contention." }
    ]
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (err) { console.error("Fetch students failed", err); }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/companies`);
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (err) { console.error("Fetch companies failed", err); }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/applications`);
      const data = await res.json();
      if (Array.isArray(data)) setApplications(data);
    } catch (err) { console.error("Fetch applications failed", err); }
  };

  const fetchData = useCallback(() => {
    fetchStudents();
    fetchCompanies();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  const handleAuthSubmit = async (formData) => {
    const sanitizedEmail = sanitizeInput(formData.email);
    const sanitizedRole = sanitizeInput(formData.role);
    const endpoint = authMode === 'signup' ? '/signup' : '/login';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizedEmail, password: formData.password, role: sanitizedRole })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || 'Authentication Successful!');
        if (authMode === 'login') {
          setIsLoggedIn(true);
          setCurrentUser(data.user || { email: sanitizedEmail, role: sanitizedRole });
          setRole(data.user?.role || sanitizedRole);
        } else {
          setAuthMode('login');
        }
      } else {
        alert(data.error || 'Authentication Failed!');
      }
    } catch (err) {
      alert('Backend Infrastructure Offline! Starting Local Enterprise Session.');
      setIsLoggedIn(true);
      setCurrentUser({ email: sanitizedEmail, role: sanitizedRole });
      setRole(sanitizedRole);
    }
  };

  const handleAdminQuickAccess = () => {
    setIsLoggedIn(true);
    setRole('admin');
    setCurrentUser({ email: 'admin@university.edu', role: 'admin' });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const sanitizedData = {
      name: sanitizeInput(studentForm.name),
      email: sanitizeInput(studentForm.email),
      dept: sanitizeInput(studentForm.dept),
      cgpa: parseFloat(studentForm.cgpa) || 0,
      resume_link: sanitizeInput(studentForm.resume_link),
      github_url: sanitizeInput(studentForm.github_url),
      linkedin_url: sanitizeInput(studentForm.linkedin_url),
      projects_info: sanitizeInput(studentForm.projects_info),
    };

    try {
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });
      if (res.ok) {
        alert('Candidate Profile Master Record Updated!');
        setStudentForm({ name: '', email: '', dept: 'BCA', cgpa: '', resume_link: '', github_url: '', linkedin_url: '', projects_info: '' });
        fetchStudents();
      }
    } catch (err) { alert('Failed to save candidate record'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this candidate?")) return;
    try {
      const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Student record removed!');
        fetchStudents();
      }
    } catch (err) { alert('Delete failed'); }
  };

  const toggleVerification = async (studentId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/students/${studentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !currentStatus })
      });
      if (res.ok) fetchStudents();
    } catch (err) { console.error("Verification error", err); }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    const sanitizedCompanyData = {
      company_name: sanitizeInput(companyForm.company_name),
      role: sanitizeInput(companyForm.role),
      package: parseFloat(companyForm.package) || 0,
      eligibility_cgpa: parseFloat(companyForm.eligibility_cgpa) || 0,
      location: sanitizeInput(companyForm.location),
      required_skills: sanitizeInput(companyForm.required_skills),
      company_type: companyForm.company_type
    };

    try {
      const res = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedCompanyData)
      });
      if (res.ok) {
        alert('New Recruitment Drive Published!');
        setAnnouncement(`🎉 New Drive: ${sanitizedCompanyData.company_name} hiring for ${sanitizedCompanyData.role}`);
        setCompanyForm({ company_name: '', role: '', package: '', eligibility_cgpa: '', location: 'Chennai', required_skills: '', company_type: 'Product-Based Tier 1' });
        fetchCompanies();
      }
    } catch (err) { alert('Failed to post recruitment drive'); }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Delete this recruitment drive?")) return;
    try {
      const res = await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Company drive removed!');
        fetchCompanies();
      }
    } catch (err) { alert('Delete failed'); }
  };

  const handleApply = async (companyId) => {
    const currentStudentObj = students.find(s => s.email === currentUser?.email);
    if (!currentStudentObj) {
      alert("⚠️ Student Profile not found. Please register/complete your student record first!");
      setActiveTab('students');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentStudentObj.id, company_id: companyId })
      });
      if (res.ok) {
        alert('🎯 Application Transmitted Successfully!');
        fetchApplications();
      } else {
        alert('Already Applied to this Drive!');
      }
    } catch (err) { alert('Application failed'); }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Application status updated to ${newStatus} & Email notification dispatched!`);
        fetchApplications();
      }
    } catch (err) { alert('Status update failed'); }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    const newSchedule = { ...schedule, id: Date.now() };
    setScheduledList([...scheduledList, newSchedule]);
    alert(`📅 Interview Slot Successfully Calendar-Synced & Booked for Candidate #${schedule.student_id}`);
    setSchedule({ student_id: '', company_name: '', date: '', time: '', mode: 'Online (Google Meet)' });
  };

  const handleRequestOfferStatus = (companyName) => {
    alert(`📩 Direct Query Dispatched to Placement Cell Admin regarding Offer Letter status for ${companyName}. Admin will get back via Portal/Call.`);
  };

  const exportToExcel = () => {
    const exportData = students.map(s => ({
      ID: s.id,
      Name: s.name,
      Department: s.dept,
      CGPA: s.cgpa,
      Email: s.email,
      Status: s.is_verified ? 'Verified' : 'Pending',
      Skills: s.projects_info || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placement Candidates");
    XLSX.writeFile(workbook, "Institutional_Placement_Report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Institutional Placement Candidate Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = ["ID", "Name", "Dept", "CGPA", "Email", "Status"];
    const tableRows = students.map(s => [
      s.id, s.name, s.dept, s.cgpa, s.email, s.is_verified ? 'Verified' : 'Pending'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] }
    });

    doc.save("Placement_Candidate_Report.pdf");
  };

  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f8fafc' : '#0f172a',
    subText: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    inputBg: darkMode ? '#334155' : '#ffffff',
    highlight: '#0284c7',
  };

  if (!isLoggedIn) {
    return <Auth authMode={authMode} setAuthMode={setAuthMode} handleAuthSubmit={handleAuthSubmit} handleAdminQuickAccess={handleAdminQuickAccess} />;
  }

  const currentStudentObj = students.find(s => s.email === currentUser?.email) || students[0];

  const filteredCompanies = companies.filter(c => {
    const matchesLocation = filterLocation === 'All' || c.location === filterLocation;
    const matchesSalary = filterMinSalary === '' || parseFloat(c.package) >= parseFloat(filterMinSalary);
    return matchesLocation && matchesSalary;
  });

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.dept?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const verifiedStudentsCount = students.filter(s => s.is_verified).length;
  const placementRate = students.length > 0 ? Math.round((verifiedStudentsCount / students.length) * 100) : 0;

  const pieData = {
    labels: ['Verified Candidates', 'Pending Verification'],
    datasets: [{
      data: [verifiedStudentsCount, Math.max(0, students.length - verifiedStudentsCount)],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 1
    }]
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', padding: '24px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ ...btnStyle, backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}` }}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
            <option value="en">🌐 English (Global Default)</option>
            <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            <option value="te">🇮🇳 తెలుగు (Telugu)</option>
          </select>

          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            <span>User: </span>
            <span style={{ color: theme.highlight, fontWeight: '700' }}>{currentUser?.email}</span>
            <span style={{ marginLeft: '8px', padding: '3px 10px', borderRadius: '6px', backgroundColor: role === 'admin' ? '#ef4444' : role === 'company' ? '#f59e0b' : '#10b981', color: '#fff', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>{role}</span>
          </div>
        </div>
        <button onClick={() => setIsLoggedIn(false)} style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>🔒 Terminate Session</button>
      </header>

      {/* ANNOUNCEMENT TICKER */}
      <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '14px 24px', borderRadius: '12px', marginBottom: '28px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)' }}>
        <span>🚀 {announcement}</span>
        <span style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>Live Broadcast</span>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800' }}>🎓 Smart Placement Portal & Global AI ATS Hub</h1>
        <p style={{ color: theme.subText, margin: 0 }}>Institutional Drive Management & Next-Gen Predictive ATS Engine</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ ...navBtn, backgroundColor: activeTab === 'dashboard' ? theme.highlight : theme.cardBg, color: activeTab === 'dashboard' ? '#fff' : theme.text }}>📊 Analytics & Dashboard</button>
          {role === 'admin' && (
            <button onClick={() => setActiveTab('admin_control')} style={{ ...navBtn, backgroundColor: activeTab === 'admin_control' ? '#ef4444' : theme.cardBg, color: activeTab === 'admin_control' ? '#fff' : theme.text }}>⚡ Admin Email & Offer Hub</button>
          )}
          <button onClick={() => setActiveTab('companies')} style={{ ...navBtn, backgroundColor: activeTab === 'companies' ? theme.highlight : theme.cardBg, color: activeTab === 'companies' ? '#fff' : theme.text }}>🏢 Drive Directory ({companies.length})</button>
          <button onClick={() => setActiveTab('students')} style={{ ...navBtn, backgroundColor: activeTab === 'students' ? theme.highlight : theme.cardBg, color: activeTab === 'students' ? '#fff' : theme.text }}>👨‍🎓 Candidate List ({students.length})</button>
          <button onClick={() => setActiveTab('applications')} style={{ ...navBtn, backgroundColor: activeTab === 'applications' ? theme.highlight : theme.cardBg, color: activeTab === 'applications' ? '#fff' : theme.text }}>🎯 Applications & Offer Status ({applications.length})</button>
          <button onClick={() => setActiveTab('roadmap')} style={{ ...navBtn, backgroundColor: activeTab === 'roadmap' ? '#10b981' : theme.cardBg, color: activeTab === 'roadmap' ? '#fff' : theme.text }}>🚀 360° AI Skill Roadmap</button>
          <button onClick={() => setActiveTab('tools')} style={{ ...navBtn, backgroundColor: activeTab === 'tools' ? '#8b5cf6' : theme.cardBg, color: activeTab === 'tools' ? '#fff' : theme.text }}>📅 Calendar Booking & AI Prep</button>
          <button onClick={() => setActiveTab('support')} style={{ ...navBtn, backgroundColor: activeTab === 'support' ? '#06b6d4' : theme.cardBg, color: activeTab === 'support' ? '#fff' : theme.text }}>💬 Support & Multi-Lang AI Hub</button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div>
          {role === 'admin' && (
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>📥 Download Institutional Master Reports</h3>
                <p style={{ margin: '4px 0 0 0', color: theme.subText, fontSize: '13px' }}>Export current placement candidate directory into PDF or Excel formats.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={exportToPDF} style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>📄 Export PDF</button>
                <button onClick={exportToExcel} style={{ ...btnStyle, backgroundColor: '#10b981', color: '#fff' }}>📊 Export Excel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '13px', color: theme.subText }}>Total Registered Candidates</span>
              <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0' }}>{students.length}</p>
            </div>
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '13px', color: theme.subText }}>Verified Student Profiles</span>
              <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0', color: '#10b981' }}>{verifiedStudentsCount}</p>
            </div>
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '13px', color: theme.subText }}>Active Corporate Drives</span>
              <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0', color: theme.highlight }}>{companies.length}</p>
            </div>
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '13px', color: theme.subText }}>Total Applications Submitted</span>
              <p style={{ fontSize: '36px', fontWeight: '800', margin: '8px 0 0 0', color: '#f59e0b' }}>{applications.length}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ marginTop: 0 }}>📊 Institutional Verification Ratio</h3>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>
                  <span>Verified Ratio</span>
                  <span>{placementRate}% Approved</span>
                </div>
                <div style={{ width: '100%', backgroundColor: theme.border, height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${placementRate}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ marginTop: 0 }}>📈 Verification Chart</h3>
              <div style={{ maxWidth: '220px', margin: '0 auto' }}>
                <Pie data={pieData} />
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>🤖 Global AI ATS Candidate Match Index</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {companies.map(c => {
              const atsScore = calculateATSScore(currentStudentObj?.projects_info || '', c.required_skills, currentStudentObj?.cgpa || 0, c.eligibility_cgpa);
              return (
                <div key={c.id} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{c.company_name}</h3>
                    <span style={{ backgroundColor: atsScore >= 75 ? '#10b98120' : '#f59e0b20', color: atsScore >= 75 ? '#10b981' : '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                      {atsScore}% ATS Score
                    </span>
                  </div>
                  <p style={{ color: theme.subText, fontSize: '13px', margin: '8px 0' }}>Role: <strong>{c.role}</strong> | Eligibility: {c.eligibility_cgpa} CGPA</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: ADMIN CONTROL & OFFER HUB */}
      {activeTab === 'admin_control' && role === 'admin' && <AdminDashboard />}

      {/* TAB 2: CORPORATE DRIVES */}
      {activeTab === 'companies' && (
        <div>
          {(role === 'admin' || role === 'company') && (
            <form onSubmit={handleAddCompany} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '28px' }}>
              <h3>📢 Post Global Corporate Recruitment Drive</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <input placeholder="Company Name" value={companyForm.company_name} onChange={e => setCompanyForm({...companyForm, company_name: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                <input placeholder="Job Role" value={companyForm.role} onChange={e => setCompanyForm({...companyForm, role: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                <input placeholder="Package (LPA)" type="number" step="0.1" value={companyForm.package} onChange={e => setCompanyForm({...companyForm, package: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                <input placeholder="Eligibility CGPA" type="number" step="0.1" value={companyForm.eligibility_cgpa} onChange={e => setCompanyForm({...companyForm, eligibility_cgpa: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                <select value={companyForm.company_type} onChange={e => setCompanyForm({...companyForm, company_type: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                  <option value="Product-Based Tier 1">Product-Based (Tier 1)</option>
                  <option value="Service-Based Corporate">Service-Based Corporate</option>
                  <option value="Global R&D Lab">Global R&D Lab</option>
                </select>
                <select value={companyForm.location} onChange={e => setCompanyForm({...companyForm, location: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                  <option value="Chennai">Chennai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Remote (Global)">Remote (Global)</option>
                </select>
                <input placeholder="Required Skills (e.g. C++, SQL, AI)" value={companyForm.required_skills} onChange={e => setCompanyForm({...companyForm, required_skills: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              </div>

              {role === 'company' && (
                <div style={{ marginTop: '16px', borderTop: `1px dashed ${theme.border}`, paddingTop: '16px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '8px' }}>📄 Mandatory Company Offer Letter Template Upload (.pdf)</label>
                  <input type="file" accept=".pdf" onChange={(e) => setOfferLetterFile(e.target.files[0])} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
                </div>
              )}

              <button type="submit" style={{ ...btnStyle, backgroundColor: '#10b981', color: '#fff', marginTop: '16px' }}>🚀 Publish Placement Drive</button>
            </form>
          )}

          <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>🔍 Filter Drives:</span>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ ...inputStyle, width: 'auto', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
              <option value="All">All Locations</option>
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Remote (Global)">Remote (Global)</option>
            </select>
            <input placeholder="Min Salary (LPA)" type="number" value={filterMinSalary} onChange={e => setFilterMinSalary(e.target.value)} style={{ ...inputStyle, width: '160px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
          </div>

          <h2>🏢 Active Global Placement Drives</h2>
          {filteredCompanies.map(c => {
            const atsScore = calculateATSScore(currentStudentObj?.projects_info || '', c.required_skills, currentStudentObj?.cgpa || 0, c.eligibility_cgpa);
            return (
              <div key={c.id} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{c.company_name} — <span style={{ color: theme.highlight }}>{c.role}</span> <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#8b5cf620', color: '#8b5cf6', marginLeft: '8px' }}>{c.company_type || 'Tier 1 Product'}</span></h3>
                  <p style={{ margin: '4px 0', color: theme.subText, fontSize: '14px' }}>Package: <strong>{c.package} LPA</strong> | Location: {c.location} | Cutoff: {c.eligibility_cgpa} CGPA</p>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🤖 AI Match: {atsScore}%</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleApply(c.id)} style={{ ...btnStyle, backgroundColor: theme.highlight, color: '#fff' }}>🎯 One-Click Apply</button>
                  {role === 'admin' && (
                    <button onClick={() => handleDeleteCompany(c.id)} style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>🗑️ Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CANDIDATE DIRECTORY */}
      {activeTab === 'students' && (
        <div>
          <form onSubmit={handleAddStudent} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '28px' }}>
            <h3>👨‍🎓 Register / Update Student Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <input placeholder="Full Name" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="Email Address" type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <select value={studentForm.dept} onChange={e => setStudentForm({...studentForm, dept: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="BCA">BCA (Computer Applications)</option>
                <option value="B.Tech CS">B.Tech CS / IT</option>
                <option value="B.Sc CS">B.Sc CS</option>
                <option value="B.Com">B.Com / Commerce</option>
                <option value="BBA">BBA / Management</option>
                <option value="MCA / M.Tech">MCA / M.Tech</option>
              </select>
              <input placeholder="CGPA" type="number" step="0.01" value={studentForm.cgpa} onChange={e => setStudentForm({...studentForm, cgpa: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="Resume Link" value={studentForm.resume_link} onChange={e => setStudentForm({...studentForm, resume_link: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="GitHub URL" value={studentForm.github_url} onChange={e => setStudentForm({...studentForm, github_url: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="LinkedIn URL" value={studentForm.linkedin_url} onChange={e => setStudentForm({...studentForm, linkedin_url: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="Skills & Projects" value={studentForm.projects_info} onChange={e => setStudentForm({...studentForm, projects_info: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
            </div>
            <button type="submit" style={{ ...btnStyle, backgroundColor: '#10b981', color: '#fff', marginTop: '16px' }}>💾 Save Profile</button>
          </form>

          <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '20px' }}>
            <input placeholder="🔎 Search Candidate by Name or Department..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
          </div>

          <h2>👨‍🎓 Candidate Directory</h2>
          {filteredStudents.map(s => (
            <div key={s.id} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '18px' }}>{s.name} ({s.dept}) - <span style={{ color: s.is_verified ? '#10b981' : '#ef4444' }}>{s.is_verified ? 'VERIFIED' : 'UNVERIFIED'}</span></h4>
                <p style={{ margin: '6px 0', color: theme.subText, fontSize: '13px' }}>📧 {s.email} | 🎓 CGPA: {s.cgpa} | 🛠 Skills: {s.projects_info || 'N/A'}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {s.resume_link && <a href={s.resume_link} target="_blank" rel="noreferrer" style={linkBadgeStyle}>📄 Resume</a>}
                  {s.github_url && <a href={s.github_url} target="_blank" rel="noreferrer" style={linkBadgeStyle}>💻 GitHub</a>}
                  {s.linkedin_url && <a href={s.linkedin_url} target="_blank" rel="noreferrer" style={linkBadgeStyle}>🔗 LinkedIn</a>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  setStudentForm({ name: s.name, email: s.email, dept: s.dept, cgpa: s.cgpa, resume_link: s.resume_link || '', github_url: s.github_url || '', linkedin_url: s.linkedin_url || '', projects_info: s.projects_info || '' });
                }} style={{ ...btnStyle, backgroundColor: '#f59e0b', color: '#fff' }}>✏️ Edit</button>
                
                {role === 'admin' && (
                  <>
                    <button onClick={() => toggleVerification(s.id, s.is_verified)} style={{ ...btnStyle, backgroundColor: s.is_verified ? '#ef4444' : '#10b981', color: '#fff' }}>
                      {s.is_verified ? 'Revoke' : 'Approve'}
                    </button>
                    <button onClick={() => handleDeleteStudent(s.id)} style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>🗑️ Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: APPLICATION FUNNEL & OFFER LETTER HUB */}
      {activeTab === 'applications' && (
        <div>
          <h2>🎯 Application Status & Verified Offer Letter Dispatch Hub</h2>
          {applications.map(app => (
            <div key={app.id} style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>📌 Application Ref #{app.id} | Student ID: {app.student_id} | Drive ID: {app.company_id}</p>
                <p style={{ margin: '4px 0 0 0', color: theme.subText, fontSize: '13px' }}>Status: <strong>{app.status || 'Applied'}</strong></p>
              </div>

              {role === 'student' && (
                <div>
                  <button onClick={() => handleRequestOfferStatus(`Drive #${app.company_id}`)} style={{ ...btnStyle, backgroundColor: '#f59e0b', color: '#fff' }}>
                    📞 Query Placement Cell / Offer Status
                  </button>
                </div>
              )}

              {role === 'admin' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleUpdateAppStatus(app.id, 'Selected - Offer Letter Dispatched')} style={{ ...btnStyle, backgroundColor: '#10b981', color: '#fff' }}>
                    🎉 Release Official Offer Letter & Notify Candidate
                  </button>
                  <button onClick={() => handleUpdateAppStatus(app.id, 'Rejected')} style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: 360° SKILL ROADMAP */}
      {activeTab === 'roadmap' && (
        <SkillRoadmap userDept={currentStudentObj?.dept || 'BCA'} />
      )}

      {/* TAB 6: ADVANCED TOOLS (CALENDAR BOOKING & MOCK PREP WITH ANSWERS) */}
      {activeTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h2>📅 Automated Calendar-Synced Interview Scheduler</h2>
            <form onSubmit={handleScheduleInterview} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <input placeholder="Student ID" value={schedule.student_id} onChange={e => setSchedule({...schedule, student_id: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input placeholder="Company Name" value={schedule.company_name} onChange={e => setSchedule({...schedule, company_name: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input type="date" value={schedule.date} onChange={e => setSchedule({...schedule, date: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <input type="time" value={schedule.time} onChange={e => setSchedule({...schedule, time: e.target.value})} required style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
              <select value={schedule.mode} onChange={e => setSchedule({...schedule, mode: e.target.value})} style={{ ...inputStyle, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="Online (Google Meet)">Online (Google Meet Auto-Link)</option>
                <option value="In-Person Corporate Drive">In-Person Corporate Drive</option>
              </select>
              <button type="submit" style={{ ...btnStyle, backgroundColor: '#8b5cf6', color: '#fff' }}>📅 Confirm & Sync Calendar (.ics)</button>
            </form>
          </div>

          <div style={{ ...cardStyle, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h2>🤖 Next-Gen AI Technical Interview Prep Engine</h2>
            <p style={{ color: theme.subText, fontSize: '13px' }}>Includes Tier-1 Product vs Service company questions with Instant High-Precision Answer Keys.</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={{ ...inputStyle, width: 'auto', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="C++">C++ OOPs & Core Systems</option>
                <option value="SQL">SQL & Database Architecture</option>
                <option value="AI & Cloud Architecture">AI & Cloud Microservices</option>
              </select>

              <select value={selectedCompanyTier} onChange={e => setSelectedCompanyTier(e.target.value)} style={{ ...inputStyle, width: 'auto', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}>
                <option value="Product-Based Tier 1">Product-Based Tier 1 (Google / Amazon / Microsoft)</option>
                <option value="Service-Based Corporate">Service-Based Corporate (TCS / Infosys / Wipro)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(mockQuestionsBank[selectedSkill] || []).map((item, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '8px', backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>Q{idx + 1}: {item.q}</h4>
                  <button 
                    onClick={() => setShowAnswers({ ...showAnswers, [idx]: !showAnswers[idx] })}
                    style={{ ...btnStyle, backgroundColor: '#0284c715', color: theme.highlight, padding: '4px 10px', fontSize: '12px' }}>
                    {showAnswers[idx] ? '🙈 Hide Verified Answer Key' : '👁️ Reveal World-Class Answer Key'}
                  </button>

                  {showAnswers[idx] && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: theme.cardBg, borderRadius: '6px', borderLeft: '4px solid #10b981', fontSize: '13px' }}>
                      <strong>High-Impact Answer:</strong> {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: SUPPORT & AI QUERY HUB */}
      {activeTab === 'support' && (
        <SupportChat currentUser={currentUser} selectedLanguage={selectedLanguage} />
      )}

    </div>
  );
}

const navBtn = { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnStyle = { padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { padding: '20px', borderRadius: '12px', border: '1px solid' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid', boxSizing: 'border-box' };
const linkBadgeStyle = { backgroundColor: '#0284c715', color: '#0284c7', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' };

export default App;