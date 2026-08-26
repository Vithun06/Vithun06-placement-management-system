require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'worldwide_enterprise_super_secret_key_2026';

// ------------------- MIDDLEWARE SETUP -------------------
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// In-Memory Data Storage (Fallback Engine)
let inMemoryUsers = [];
let inMemoryStudents = [
  { id: 1, name: "Karthik", email: process.env.EMAIL_USER || "student@gmail.com", dept: "BCA", cgpa: "8.5", resume_link: "https://drive.google.com", github_url: "https://github.com", linkedin_url: "https://linkedin.com", projects_info: "Smart Resume Builder, Placement Portal", is_verified: true }
];
let inMemoryCompanies = [
  { id: 101, company_name: "Zoho Corporation", role: "Software Engineer", package: "8 LPA", eligibility_cgpa: "7.5", location: "Chennai", required_skills: "C++, SQL, React" }
];
let inMemoryApplications = [];
let interviewSchedules = [];

// PostgreSQL Pool Connection Setup
let pool = null;
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your_password')) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
    });
    pool.on('error', (err) => console.log('PostgreSQL Warning:', err.message));
  } catch (err) {
    console.log('PostgreSQL Pool Connection Skipped');
  }
}

// ------------------- NODEMAILER SERVICE CONFIG -------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mr.vithun6@gmail.com',
    pass: process.env.EMAIL_PASS || 'uzle xnvg tzyf egru'
  }
});

// Helper for Validation Error Handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Security Guard: JWT Token Verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or Expired Security Token!' });
    req.user = user;
    next();
  });
};

// Security Guard: Role-Based Access Control (RBAC)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized Action' });
    }
    next();
  };
};

// ------------------- ROUTE ENDPOINTS -------------------

app.get('/', (req, res) => {
  res.send('Placement Management System Engine with Automated Email Alerts & AI Prep is Active! 🚀');
});

// 1. SIGNUP & LOGIN
app.post('/api/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'admin', 'company'])
], handleValidationErrors, async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let createdUser = null;

    if (pool) {
      try {
        const newUser = await pool.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
          [email, hashedPassword, role]
        );
        createdUser = newUser.rows[0];
      } catch (dbErr) {}
    }

    if (!createdUser) {
      const existing = inMemoryUsers.find(u => u.email === email);
      if (existing) {
        return res.status(400).json({ error: 'User already exists with this email!' });
      }
      createdUser = { id: Date.now(), email, password: hashedPassword, role };
      inMemoryUsers.push(createdUser);
    }

    res.status(201).json({ 
      message: 'User Account Created Successfully!', 
      user: { id: createdUser.id, email: createdUser.email, role: createdUser.role } 
    });
  } catch (err) {
    res.status(500).json({ error: `Signup Failed: ${err.message}` });
  }
});

app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], handleValidationErrors, async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = null;

    if (pool) {
      try {
        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length > 0) user = userQuery.rows[0];
      } catch (e) {}
    }

    if (!user) user = inMemoryUsers.find(u => u.email === email);

    if (!user) return res.status(400).json({ error: 'Invalid Email or Password!' });

    const userPasswordHash = user.password_hash || user.password;
    const validPassword = await bcrypt.compare(password, userPasswordHash);
    
    if (!validPassword) return res.status(400).json({ error: 'Invalid Email or Password!' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ message: 'Authentication Successful!', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error!' });
  }
});

// 2. STUDENTS MANAGEMENT (Full CRUD + Admin Verification)
app.get('/api/students', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM students ORDER BY id DESC');
      return res.json(result.rows);
    }
    res.json(inMemoryStudents);
  } catch (err) {
    res.json(inMemoryStudents);
  }
});

app.post('/api/students', authenticateToken, authorizeRoles('admin', 'student'), async (req, res) => {
  const { name, email, dept, cgpa, resume_link, github_url, linkedin_url, projects_info } = req.body;
  const newStudent = { id: Date.now(), name, email, dept, cgpa, resume_link, github_url, linkedin_url, projects_info, is_verified: false };
  
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO students (name, email, dept, cgpa, resume_link, github_url, linkedin_url, projects_info, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [name, email, dept, cgpa, resume_link, github_url || '', linkedin_url || '', projects_info || '', false]
      );
    } catch (e) {}
  }
  inMemoryStudents.push(newStudent);
  res.status(201).json({ message: 'Student registered successfully!', data: newStudent });
});

// Admin Verification Seal Action
app.patch('/api/students/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  try {
    let student = inMemoryStudents.find(s => s.id == id);
    if (student) {
      student.is_verified = is_verified;
    }

    if (pool) {
      try {
        await pool.query('UPDATE students SET is_verified = $1 WHERE id = $2', [is_verified, id]);
      } catch (e) {}
    }

    res.json({ message: `Student Verification Status updated to ${is_verified}`, data: student });
  } catch (err) {
    res.status(500).json({ error: 'Verification Status Update Failed' });
  }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryStudents = inMemoryStudents.filter(s => s.id != id);
  if (pool) {
    try {
      await pool.query('DELETE FROM students WHERE id = $1', [id]);
    } catch (e) {}
  }
  res.json({ message: 'Student Profile Removed Successfully!' });
});

// 3. COMPANIES MANAGEMENT (CRUD)
app.get('/api/companies', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM companies ORDER BY id DESC');
      return res.json(result.rows);
    }
    res.json(inMemoryCompanies);
  } catch (err) {
    res.json(inMemoryCompanies);
  }
});

app.post('/api/companies', authenticateToken, authorizeRoles('admin', 'company'), async (req, res) => {
  const { company_name, role, package: pkg, eligibility_cgpa, location, required_skills } = req.body;
  const newCompany = { id: Date.now(), company_name, role, package: pkg, eligibility_cgpa, location: location || 'Chennai', required_skills: required_skills || 'General' };
  
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO companies (company_name, role, package, eligibility_cgpa, location, required_skills)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [company_name, role, pkg, eligibility_cgpa, location || 'Chennai', required_skills || 'General']
      );
    } catch (e) {}
  }
  inMemoryCompanies.push(newCompany);
  res.status(201).json({ message: 'Company drive posted successfully!', data: newCompany });
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryCompanies = inMemoryCompanies.filter(c => c.id != id);
  if (pool) {
    try {
      await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    } catch (e) {}
  }
  res.json({ message: 'Company Drive Removed Successfully!' });
});

// 4. APPLICATIONS & AUTOMATED SELECTION EMAIL TRIGGER
app.get('/api/applications', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM applications ORDER BY id DESC');
      return res.json(result.rows);
    }
    res.json(inMemoryApplications);
  } catch (err) {
    res.json(inMemoryApplications);
  }
});

app.post('/api/applications', async (req, res) => {
  const { student_id, company_id } = req.body;
  const newApp = { id: Date.now(), student_id, company_id, status: 'Applied' };
  
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO applications (student_id, company_id, status) VALUES ($1, $2, $3)',
        [student_id, company_id, 'Applied']
      );
    } catch (e) {}
  }
  inMemoryApplications.push(newApp);
  res.status(201).json({ message: 'Application Submitted Successfully!', data: newApp });
});

// 📧 UPDATE APPLICATION STATUS & AUTOMATIC EMAIL TRIGGER
app.patch('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    let appRecord = inMemoryApplications.find(a => a.id == id);
    if (appRecord) {
      appRecord.status = status;
    }

    if (pool) {
      try {
        const result = await pool.query('UPDATE applications SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows[0]) appRecord = result.rows[0];
      } catch (e) {}
    }

    if (status === 'Selected') {
      const student = inMemoryStudents.find(s => s.id == (appRecord?.student_id || 1)) || {
        name: "Student Candidate",
        email: process.env.EMAIL_USER
      };
      const company = inMemoryCompanies.find(c => c.id == (appRecord?.company_id || 101)) || {
        company_name: "Corporate Partner",
        role: "Software Developer",
        package: "Competitive CTC"
      };

      if (student && student.email) {
        const mailOptions = {
          from: `"Placement Cell" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `🎉 Congratulations! Selected for ${company.company_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
              <h2 style="color: #2e7d32;">Congratulations ${student.name}! 🎉</h2>
              <p>We are thrilled to inform you that you have been officially <b>SELECTED</b> for the placement drive!</p>
              <hr />
              <p><b>Company:</b> ${company.company_name}</p>
              <p><b>Role:</b> ${company.role}</p>
              <p><b>Package:</b> ${company.package}</p>
              <hr />
              <p>The placement office will reach out to you with further onboarding details shortly.</p>
              <p>Best Regards,<br/><b>Placement Management Office</b></p>
            </div>
          `
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log('❌ Nodemailer Error:', err.message);
          } else {
            console.log('✅ Selection Email Sent Successfully:', info.response);
          }
        });
      }
    }

    res.json({ message: `Application status updated to ${status}! Email Notification triggered if selected.`, data: appRecord });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update application status' });
  }
});

// 5. DIRECT EMAIL NOTIFICATION API ROUTE
app.post('/api/send-email', async (req, res) => {
  const { to, subject, message } = req.body;
  const mailOptions = {
    from: `"Placement Cell" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email Transmitted Successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 6. INTERVIEW SCHEDULER APIS
app.post('/api/interviews/schedule', (req, res) => {
  const { student_id, company_name, date, time, mode } = req.body;
  const newInterview = { id: Date.now(), student_id, company_name, date, time, mode, status: 'Scheduled' };
  interviewSchedules.push(newInterview);
  res.status(201).json({ message: 'Interview Slot Assigned!', interview: newInterview });
});

app.get('/api/interviews', (req, res) => {
  res.json(interviewSchedules);
});

// 7. AI MOCK INTERVIEW QUESTION GENERATOR API
app.get('/api/mock-questions', (req, res) => {
  const { skill } = req.query;
  
  const questionBank = {
    'C++': [
      "What is the difference between Virtual Functions and Pure Virtual Functions in C++?",
      "Explain RAII (Resource Acquisition Is Initialization) concept.",
      "How does vtable work internally during dynamic binding?"
    ],
    'SQL': [
      "What is the difference between WHERE and HAVING clause?",
      "Explain the types of Joins with execution priority.",
      "What are ACID properties in RDBMS?"
    ],
    'React': [
      "What is Virtual DOM and how does reconciliation algorithm work?",
      "Explain the difference between useEffect and useLayoutEffect.",
      "How does React State Batching operate?"
    ]
  };

  const selectedQuestions = questionBank[skill] || [
    "Tell us about your most challenging technical project.",
    "How do you approach debugging complex logic in code?",
    "Explain OOPs concepts with real-time scenarios."
  ];

  res.json({ skill, questions: selectedQuestions });
});

// ------------------- SERVER LISTENER -------------------
app.listen(PORT, () => {
  console.log(`🚀 Placement Engine with Email Alerts & Complete APIs is live on http://localhost:${PORT}`);
});
// Local In-Memory Storage for Messages / Query Tickets
let queryTickets = [];

// 1. AI Chatbot Auto-Response API
app.post('/api/chat/ai', (req, res) => {
  const { message } = req.body;
  const lowerMsg = message ? message.toLowerCase() : '';
  
  let botReply = "I am the Placement AI Assistant. How can I help you with your drives, eligibility, or interview process?";

  if (lowerMsg.includes('eligibility') || lowerMsg.includes('cgpa')) {
    botReply = "Standard eligibility is usually 6.0 CGPA & no active arrears, but specific MNCs may require 7.0+ CGPA. Check individual Drive cards for exact criteria.";
  } else if (lowerMsg.includes('resume') || lowerMsg.includes('format')) {
    botReply = "Make sure your resume includes your LinkedIn, GitHub, Projects, and verified CGPA before applying to any drive.";
  } else if (lowerMsg.includes('status') || lowerMsg.includes('result')) {
    botReply = "You can track your application status under the 'Applications Log' tab. Statuses update in real-time when companies shortlist candidates.";
  } else if (lowerMsg.includes('schedule') || lowerMsg.includes('interview')) {
    botReply = "Interview dates and Google Meet links are available in the 'Interviews & AI Prep' tab once shortlisted.";
  }

  res.json({ reply: botReply });
});

// 2. Submit Human Support Query Ticket (Student -> Admin)
app.post('/api/tickets', (req, res) => {
  const { student_id, student_email, student_name, query_text } = req.body;
  const newTicket = {
    id: Date.now(),
    student_id: student_id || 'N/A',
    student_email,
    student_name: student_name || student_email,
    query_text,
    status: 'Pending', // Pending, Resolved
    admin_reply: '',
    call_slot: null, // e.g., "Today 4:00 PM - 5:00 PM"
    created_at: new Date().toLocaleString()
  };
  queryTickets.unshift(newTicket);
  res.json({ message: 'Query Ticket Submitted Successfully!', ticket: newTicket });
});

// 3. Get All Query Tickets (Admin View)
app.get('/api/tickets', (req, res) => {
  res.json(queryTickets);
});

// 4. Resolve Query Ticket (Admin Reply via Text or Call Slot)
app.patch('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { admin_reply, call_slot, status } = req.body;
  
  const ticket = queryTickets.find(t => t.id === parseInt(id));
  if (ticket) {
    if (admin_reply !== undefined) ticket.admin_reply = admin_reply;
    if (call_slot !== undefined) ticket.call_slot = call_slot;
    if (status) ticket.status = status;
    res.json({ message: 'Ticket updated successfully', ticket });
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});