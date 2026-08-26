import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [logs, setLogs] = useState([
    { id: 1, action: 'Drive Posted: TechCorp India', time: '10:30 AM' },
    { id: 2, action: 'Student Verified: ID #102', time: '11:15 AM' }
  ]);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/applications');
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setMessage('Updating status and triggering email...');
      const response = await axios.patch(`http://localhost:5000/api/applications/${appId}`, {
        status: newStatus
      });

      setMessage(response.data.message || 'Status updated successfully!');
      fetchApplications();
      
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Failed to update status:', error);
      setMessage('Failed to update status');
    }
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim() && !emailSubject.trim()) return;

    if (broadcastMessage.trim()) {
      setLogs([{ id: Date.now(), action: `Broadcast Dispatched: "${broadcastMessage}"`, time: new Date().toLocaleTimeString() }, ...logs]);
      alert('📢 Institutional Broadcast Announcement Transmitted!');
      setBroadcastMessage('');
    }

    if (emailSubject.trim() || emailBody.trim()) {
      alert(`📢 Enterprise Broadcast Dispatched to All Registered Candidates & Corporates!\nSubject: ${emailSubject}`);
      setEmailSubject('');
      setEmailBody('');
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh', color: '#0f172a', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ color: '#1e293b', margin: 0 }}>🏛️ Placement Cell - Admin Central Dashboard</h1>
      <p style={{ color: '#64748b', margin: 0 }}>Manage student applications, status alerts, and official enterprise broadcasts.</p>

      {message && (
        <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* Analytics Cards */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#64748b' }}>Total Applications</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#2563eb' }}>{applications.length}</p>
        </div>
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, color: '#64748b' }}>Selected Candidates</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#16a34a' }}>
            {applications.filter(a => a.status === 'Selected').length}
          </p>
        </div>
      </div>

      {/* Admin Master Operations Hub */}
      <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>⚡ Admin Master Operations & Offer Dispatch Hub</h2>
        <form onSubmit={handleSendBroadcast} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input 
            placeholder="Type global campus broadcast message..." 
            value={broadcastMessage} 
            onChange={(e) => setBroadcastMessage(e.target.value)} 
            style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#334155', border: '1px solid #475569', color: '#fff' }} 
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            📢 Dispatch Announcement
          </button>
        </form>

        <h3>📜 Real-time System Audit Logs</h3>
        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', maxHeight: '160px', overflowY: 'auto' }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b', fontSize: '13px' }}>
              <span>{log.action}</span>
              <span style={{ color: '#94a3b8' }}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise Broadcast Section */}
      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}>
        <h2>⚡ Broadcast Email & Offer Notification Hub</h2>
        <form onSubmit={handleSendBroadcast}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px' }}>Email Subject:</label>
            <input 
              type="text" 
              value={emailSubject} 
              onChange={(e) => setEmailSubject(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px' }}>Email Body / Notification Message:</label>
            <textarea 
              rows="4" 
              value={emailBody} 
              onChange={(e) => setEmailBody(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} 
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            ✉️ Dispatch Official Broadcast
          </button>
        </form>
      </div>

      {/* Applications Table */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2>Recent Applications</h2>
        {loading ? (
          <p>Loading applications...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>App ID</th>
                <th style={{ padding: '12px' }}>Student ID</th>
                <th style={{ padding: '12px' }}>Company ID</th>
                <th style={{ padding: '12px' }}>Current Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>No applications found. Submit an application first.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>#{app.id}</td>
                    <td style={{ padding: '12px' }}>Student #{app.student_id || 1}</td>
                    <td style={{ padding: '12px' }}>Company #{app.company_id || 101}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: app.status === 'Selected' ? '#dcfce7' : app.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                        color: app.status === 'Selected' ? '#16a34a' : app.status === 'Rejected' ? '#dc2626' : '#d97706'
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleStatusChange(app.id, 'Selected')}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Select & Send Email ✉️
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'Rejected')}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}