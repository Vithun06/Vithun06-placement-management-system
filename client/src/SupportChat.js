import React, { useState, useEffect } from 'react';

const languageList = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (கன்னட)' },
  { code: 'ml', name: 'Malayalam (மலையாளம்)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'zh', name: 'Mandarin Chinese' },
  { code: 'ja', name: 'Japanese (日本語)' }
];

const mockQuestionsData = {
  'MAANG / Big Tech (Google, Meta, Apple, Amazon)': {
    'System Design & Microservices': [
      { q: "How do you design a high-throughput Distributed Rate Limiter?", a: "Use Token Bucket or Leaky Bucket algorithm backed by Redis cluster for sub-millisecond response." },
      { q: "Explain CAP Theorem in Distributed Databases.", a: "CAP states a distributed system can only provide two of three guarantees: Consistency, Availability, Partition tolerance." }
    ],
    'Generative AI & LLMs': [
      { q: "What is RAG (Retrieval-Augmented Generation) and how to reduce hallucinations?", a: "RAG retrieves relevant external knowledge chunks using vector embeddings before passing to the LLM context window." }
    ]
  },
  'Product-Based Tech Giants (Microsoft, Adobe, Uber)': {
    'Full Stack & Cloud Architecture': [
      { q: "How do React Server Components (RSC) differ from Client Components?", a: "RSC execute solely on the server and send zero JavaScript bundle to the client, reducing overall load times." }
    ]
  },
  'Fast-Growing Tech Startups (Unicorns & Early Stage)': {
    'Modern Web3 & AI Integrations': [
      { q: "How do you scale a Node.js API server to handle 100k concurrent WebSocket connections?", a: "Utilize Node cluster module, horizontal scaling behind Nginx load balancer, and Redis Pub/Sub for state sync." }
    ]
  },
  'Global IT Service Enterprises (TCS, Infosys, Accenture)': {
    'Data Structures & DBMS (RDBMS/SQL)': [
      { q: "What is Database Indexing and B-Tree structure?", a: "Indexing creates a lookup table that allows the engine to locate records quickly without full table scans." }
    ]
  }
};

const roadmapsData = {
  'Computer Applications & IT (BCA / B.Sc CS)': {
    skills: ['Modern JavaScript (ES6+)', 'React / Next.js Framework', 'REST & GraphQL APIs', 'Node.js Backend'],
    courses: ['Meta Front-End Developer Certificate', 'AWS Cloud Practitioner', 'MongoDB University Foundations']
  },
  'Computer Science & Core Engineering (B.E / B.Tech CSE)': {
    skills: ['Advanced Data Structures & Algorithms', 'System Architecture Design', 'Docker & Kubernetes', 'SQL/NoSQL Databases'],
    courses: ['Google Cloud Software Engineer Path', 'LeetCode Algorithmic Mastery', 'Docker & K8s Certified Master']
  },
  'Artificial Intelligence & Data Science (AI/DS)': {
    skills: ['Python Data Stack (Pandas, NumPy)', 'TensorFlow & PyTorch', 'LLM Fine-Tuning & RAG', 'MLOps Tools'],
    courses: ['DeepLearning.AI Machine Learning Specialization', 'Microsoft Certified: Azure AI Engineer']
  },
  'Cybersecurity & Ethical Hacking': {
    skills: ['Network Security & Wireshark', 'Penetration Testing', 'SIEM & SOC Operations', 'Cryptography'],
    courses: ['CompTIA Security+', 'Certified Ethical Hacker (CEH)', 'Offensive Security Certified Professional (OSCP)']
  },
  'Electronics & Hardware (ECE / EEE)': {
    skills: ['Embedded C / C++', 'IoT Protocol Stack (MQTT/CoAP)', 'VLSI Architecture', 'RTOS'],
    courses: ['Arm Education Embedded Systems', 'NVIDIA Edge AI Certification']
  }
};

export default function SupportChat({ currentUser, role, selectedLanguage, setSelectedLanguage }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👋 Hello! I am your Placement AI Assistant. Ask me anything about eligibility, interviews, or drives!' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [humanQuery, setHumanQuery] = useState('');

  const [langSearch, setLangSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('MAANG / Big Tech (Google, Meta, Apple, Amazon)');
  const [selectedTopic, setSelectedTopic] = useState('System Design & Microservices');
  const [selectedDept, setSelectedDept] = useState('Computer Applications & IT (BCA / B.Sc CS)');

  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [callSlotText, setCallSlotText] = useState({});

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (role === 'admin') fetchTickets();
  }, [role]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets`);
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (err) { console.error("Fetch tickets failed", err); }
  };

  const handleSendAIMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    try {
      const res = await fetch(`${API_URL}/chat/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, language: selectedLanguage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "⚠️ AI Bot is currently offline." }]);
    }
  };

  const handleSubmitHumanQuery = async (e) => {
    e.preventDefault();
    if (!humanQuery.trim()) return;

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_email: currentUser?.email || 'student@univ.edu',
          student_name: currentUser?.email?.split('@')[0],
          query_text: humanQuery
        })
      });
      if (res.ok) {
        alert('📩 Query transmitted to Placement Cell! The Admin will reply via Text or assign a Phone Call Slot.');
        setHumanQuery('');
        setIsHumanMode(false);
      }
    } catch (err) { alert('Failed to submit ticket.'); }
  };

  const handleResolveTicket = async (ticketId, actionType) => {
    const payload = { status: 'Resolved' };
    if (actionType === 'text') payload.admin_reply = replyText[ticketId] || 'Query resolved.';
    if (actionType === 'call') payload.call_slot = callSlotText[ticketId] || 'Call Scheduled Today between 3:00 PM - 5:00 PM';

    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Ticket Status Updated!');
        fetchTickets();
      }
    } catch (err) { alert('Failed to update ticket.'); }
  };

  const filteredLanguages = languageList.filter(lang =>
    lang.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  const availableTopics = Object.keys(mockQuestionsData[selectedCategory] || {});
  const currentQuestions = mockQuestionsData[selectedCategory]?.[selectedTopic] || [];

  if (role === 'admin') {
    return (
      <div style={containerStyle}>
        <h2>💬 Placement Cell Support Ticket Resolver (Admin Panel)</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Review student queries and choose to reply via Text Message or assign a Dedicated Phone Call Slot.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {tickets.length === 0 ? <p>No pending queries from students.</p> : tickets.map(t => (
            <div key={t.id} style={{ ...cardStyle, borderColor: t.status === 'Resolved' ? '#10b981' : '#f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>👤 Candidate: {t.student_name} ({t.student_email})</h4>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: t.status === 'Resolved' ? '#10b98120' : '#f59e0b20', color: t.status === 'Resolved' ? '#10b981' : '#f59e0b' }}>
                  {t.status}
                </span>
              </div>
              <p style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', margin: '12px 0' }}><strong>Query:</strong> {t.query_text}</p>
              
              {t.admin_reply && <p style={{ color: '#0284c7', margin: '4px 0' }}><strong>💬 Admin Reply:</strong> {t.admin_reply}</p>}
              {t.call_slot && <p style={{ color: '#8b5cf6', margin: '4px 0' }}><strong>📞 Assigned Phone Slot:</strong> {t.call_slot}</p>}

              {t.status === 'Pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <input 
                      placeholder="Type text reply..." 
                      value={replyText[t.id] || ''} 
                      onChange={e => setReplyText({...replyText, [t.id]: e.target.value})}
                      style={inputStyle} 
                    />
                    <button onClick={() => handleResolveTicket(t.id, 'text')} style={{ ...btnStyle, backgroundColor: '#0284c7', color: '#fff', marginTop: '6px' }}>
                      ✉️ Send Text Reply
                    </button>
                  </div>

                  <div>
                    <input 
                      placeholder="Call Slot (e.g. Today 4 PM - 5 PM)..." 
                      value={callSlotText[t.id] || ''} 
                      onChange={e => setCallSlotText({...callSlotText, [t.id]: e.target.value})}
                      style={inputStyle} 
                    />
                    <button onClick={() => handleResolveTicket(t.id, 'call')} style={{ ...btnStyle, backgroundColor: '#8b5cf6', color: '#fff', marginTop: '6px' }}>
                      📞 Assign Call Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 1. Global Language Selector with Search Bar */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>🌐 Search & Select Global Interface Language:</label>
        <input
          type="text"
          placeholder="🔍 Search Language (e.g., Tamil, English, German)..."
          value={langSearch}
          onChange={(e) => setLangSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: '8px' }}
        />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ ...inputStyle, borderColor: '#0284c7' }}
        >
          {filteredLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      {/* 2. Global Technical Interview Prep Engine */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <h2>🎯 Global Technical Interview Simulator</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>🏢 Company Category & Tier:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const nextTopics = Object.keys(mockQuestionsData[e.target.value] || {});
                setSelectedTopic(nextTopics[0] || '');
              }}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              {Object.keys(mockQuestionsData).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>📚 Trending Topic Area:</label>
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              {availableTopics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
        </div>

        <div>
          <h4>💡 High-Priority Technical Questions & AI Answers:</h4>
          {currentQuestions.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #0284c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Q{idx + 1}: {item.q}</p>
              <p style={{ color: '#16a34a', margin: 0, fontSize: '14px' }}><strong>AI Suggested Answer:</strong> {item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 360° Multi-Department Roadmap */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <h2>🚀 360° Department Career Roadmap</h2>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Academic Department:</label>
        <select 
          value={selectedDept} 
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ ...inputStyle, marginBottom: '15px' }}
        >
          {Object.keys(roadmapsData).map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ color: '#166534', margin: '0 0 8px 0' }}>🛠️ Core Tech Skills:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {roadmapsData[selectedDept]?.skills.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>🎓 Top Certifications:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {roadmapsData[selectedDept]?.courses.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Student Hybrid AI & Human Support Hub */}
      <h2>💬 Placement AI Assistant & Hybrid Support Hub</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
        <button 
          onClick={() => setIsHumanMode(false)} 
          style={{ ...btnStyle, backgroundColor: !isHumanMode ? '#0284c7' : '#e2e8f0', color: !isHumanMode ? '#fff' : '#000' }}>
          🤖 Talk to AI Bot
        </button>
        <button 
          onClick={() => setIsHumanMode(true)} 
          style={{ ...btnStyle, backgroundColor: isHumanMode ? '#ef4444' : '#e2e8f0', color: isHumanMode ? '#fff' : '#000' }}>
          👤 Request Placement Officer Help
        </button>
      </div>

      {!isHumanMode ? (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', marginBottom: '12px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  backgroundColor: m.sender === 'user' ? '#0284c7' : '#f1f5f9', 
                  color: m.sender === 'user' ? '#fff' : '#0f172a',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendAIMessage} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input 
              placeholder="Ask AI bot about drives, eligibility, resume rules..." 
              value={inputMsg} 
              onChange={e => setInputMsg(e.target.value)} 
              style={inputStyle} 
            />
            <button type="submit" style={{ ...btnStyle, backgroundColor: '#0284c7', color: '#fff' }}>Send</button>
          </form>
        </div>
      ) : (
        <div style={{ ...cardStyle, borderColor: '#ef4444' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>🚨 Direct Message to Placement Cell</h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Describe your issue below. The Placement Officer will review and reply via text or assign a phone call slot.</p>
          <form onSubmit={handleSubmitHumanQuery}>
            <textarea 
              rows="4" 
              placeholder="Explain your issue in detail..." 
              value={humanQuery} 
              onChange={e => setHumanQuery(e.target.value)} 
              required 
              style={{ ...inputStyle, marginBottom: '12px' }} 
            />
            <button type="submit" style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff' }}>
              📩 Transmit Query to Placement Officer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const containerStyle = { padding: '20px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' };
const cardStyle = { padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#faf8f5' };
const btnStyle = { padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };