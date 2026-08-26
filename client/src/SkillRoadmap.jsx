import React, { useState } from 'react';

const SKILL_DATABASE = {
  BCA: [
    { name: 'C++ & Data Structures', priority: 'Priority 1 (Core)', youtube: 'https://www.youtube.com/results?search_query=c%2B%2B+data+structures+full+course+tamil', practice: 'https://www.geeksforgeeks.org/data-structures/', pdf: 'https://www.google.com/search?q=c%2B%2B+data+structures+notes+pdf', prompt: 'Explain C++ OOPs concepts and Data Structures with simple real-world examples.' },
    { name: 'SQL & Relational Databases', priority: 'Priority 1 (Core)', youtube: 'https://www.youtube.com/results?search_query=sql+full+course+tamil', practice: 'https://www.w3schools.com/sql/', pdf: 'https://www.google.com/search?q=sql+queries+cheatsheet+pdf', prompt: 'Teach me SQL joins, indexing, and normalization step by step.' },
    { name: 'Full Stack Web Development (React & Node)', priority: 'Priority 2 (High Market Demand)', youtube: 'https://www.youtube.com/results?search_query=react+node+js+full+stack+course', practice: 'https://developer.mozilla.org/en-US/', pdf: 'https://www.google.com/search?q=fullstack+roadmap+pdf', prompt: 'How do I build a RESTful API with Node.js and connect it to React?' },
    { name: 'Cloud Computing & AWS Basics', priority: 'Priority 3 (Career Boost)', youtube: 'https://www.youtube.com/results?search_query=aws+basics+for+beginners', practice: 'https://aws.amazon.com/training/', pdf: 'https://www.google.com/search?q=aws+practitioner+study+guide+pdf', prompt: 'Explain the core services of AWS like EC2, S3, and RDS in plain language.' }
  ],
  'B.Tech CS': [
    { name: 'Data Structures & Algorithms (Advanced)', priority: 'Priority 1 (Core)', youtube: 'https://www.youtube.com/results?search_query=dsa+striver+playlist', practice: 'https://leetcode.com/', pdf: 'https://www.google.com/search?q=dsa+sheet+pdf', prompt: 'Explain dynamic programming with time and space complexity breakdown.' },
    { name: 'System Design & Distributed Systems', priority: 'Priority 1 (Core)', youtube: 'https://www.youtube.com/results?search_query=system+design+primer', practice: 'https://github.com/donnemartin/system-design-primer', pdf: 'https://www.google.com/search?q=system+design+handbook+pdf', prompt: 'How do load balancers and caching work in large scale microservices?' },
    { name: 'DevOps & Docker/Kubernetes', priority: 'Priority 2 (High Market Demand)', youtube: 'https://www.youtube.com/results?search_query=devops+docker+kubernetes+tutorial', practice: 'https://kubernetes.io/docs/', pdf: 'https://www.google.com/search?q=devops+handbook+pdf', prompt: 'Explain Docker containerization and Kubernetes orchestration step by step.' }
  ],
  'B.Com': [
    { name: 'Financial Modeling & Advanced Excel', priority: 'Priority 1 (Core)', youtube: 'https://www.youtube.com/results?search_query=excel+for+finance+tutorial', practice: 'https://www.excel-easy.com/', pdf: 'https://www.google.com/search?q=excel+formulas+cheatsheet+pdf', prompt: 'Explain VLOOKUP, INDEX MATCH, and Pivot Tables with finance examples.' },
    { name: 'Power BI & Business Analytics', priority: 'Priority 2 (High Market Demand)', youtube: 'https://www.youtube.com/results?search_query=power+bi+full+course', practice: 'https://learn.microsoft.com/en-us/power-bi/', pdf: 'https://www.google.com/search?q=power+bi+dashboard+guide+pdf', prompt: 'How do I create interactive sales dashboards using Power BI?' }
  ]
};

const roadmaps = {
  BCA: [
    { step: 'Phase 1', title: 'Core Programming & Logic', desc: 'Master C++ syntax, Object-Oriented Programming (OOPs), and dynamic memory management.' },
    { step: 'Phase 2', title: 'RDBMS & Data Systems', desc: 'Focus on SQL indexing, normalization, ACID compliance, and query optimization.' },
    { step: 'Phase 3', title: 'Modern Web Architecture', desc: 'Build scalable web applications using RESTful APIs, GraphQL, and cloud databases.' }
  ],
  Default: [
    { step: 'Phase 1', title: 'Fundamentals & Data Structures', desc: 'Algorithms, Time Complexity, Array operations, and Trees.' },
    { step: 'Phase 2', title: 'System Architecture', desc: 'Database systems, Networking, and OS principles.' },
    { step: 'Phase 3', title: 'Corporate Prep', desc: 'ATS Resume optimization, Mock Technical Interviews, and Aptitude.' }
  ]
};

export default function SkillRoadmap({ userDept = 'BCA' }) {
  const [selectedDept, setSelectedDept] = useState(userDept);
  const [customSearch, setCustomSearch] = useState('');

  const activeRoadmap = roadmaps[selectedDept] || roadmaps.Default;
  const currentSkills = SKILL_DATABASE[selectedDept] || SKILL_DATABASE['BCA'];
  const filteredSkills = currentSkills.filter(s => s.name.toLowerCase().includes(customSearch.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. First Roadmap Section */}
      <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>🚀 360° AI Skill Roadmap — Department of {selectedDept}</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Customized learning track tailored to clear Tier-1 corporate technical assessments.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {activeRoadmap.map((item, idx) => (
            <div key={idx} style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#0f172a', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>{item.step}</span>
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '16px' }}>{item.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Skill Database & Resource Hub Section */}
      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc' }}>
        <h2 style={{ marginTop: 0 }}>📊 Universal Skill Gap Analysis & 360° Learning Roadmap</h2>
        <p style={{ color: '#94a3b8' }}>Select your department for auto-suggested global market priorities, or search any skill from the unlimited directory.</p>

        {/* DEPARTMENT SELECTOR & SEARCH */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold' }}>
            <option value="BCA">BCA (Computer Applications)</option>
            <option value="B.Tech CS">B.Tech CS / IT</option>
            <option value="B.Com">B.Com / Commerce</option>
          </select>

          <input 
            placeholder="🔍 Search Skill Catalog (e.g., Python, AWS, Docker)..." 
            value={customSearch}
            onChange={(e) => setCustomSearch(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
          />
        </div>

        {/* ROADMAP LIST */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredSkills.map((skill, index) => (
            <div key={index} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#38bdf8' }}>{skill.name}</h3>
                <span style={{ backgroundColor: '#0284c720', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{skill.priority}</span>
              </div>

              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0 12px 0' }}>Multi-Resource Learning Hub:</p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a href={skill.youtube} target="_blank" rel="noreferrer" style={btnStyle('#ef4444')}>▶️ YouTube Playlists</a>
                <a href={skill.practice} target="_blank" rel="noreferrer" style={btnStyle('#10b981')}>🌐 Interactive Practice</a>
                <a href={skill.pdf} target="_blank" rel="noreferrer" style={btnStyle('#f59e0b')}>📄 PDF Notes & Books</a>
                <a href={`https://gemini.google.com/app?prompt=${encodeURIComponent(skill.prompt)}`} target="_blank" rel="noreferrer" style={btnStyle('#8b5cf6')}>✨ Ask Gemini AI</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btnStyle = (color) => ({
  backgroundColor: color,
  color: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'inline-block'
});