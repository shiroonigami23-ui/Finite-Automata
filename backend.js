const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use environment variable for teacher password
const ShiroOni = process.env.ShiroOni || 'Shiro';

let quizzes = [];        // List of all quizzes (in-memory demo, use DB for production)
let submissions = [];    // List of student submissions

// Health check
app.get('/', (req, res) => {
  res.send('Quiz Helper Backend Running!');
});

// Create a new quiz (POST /api/quiz)
app.post('/api/quiz', (req, res) => {
  if (req.body.password !== ShiroOni) {
    return res.status(401).json({error: "Unauthorized"});
  }
  const data = req.body.quiz;
  if(!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({error: "Invalid quiz data"});
  }
  const quizId = Date.now().toString();
  quizzes.push({id: quizId, questions: data});
  res.json({id: quizId, message: "Quiz created"});
});

// Get all quizzes (GET /api/quiz)
app.get('/api/quiz', (req, res) => {
  res.json(quizzes.map(q => ({id: q.id, questions: q.questions})));
});

// Submit a student response (POST /api/submit)
app.post('/api/submit', (req, res) => {
  const {quizId, studentName, answers} = req.body;
  if(!quizId || !Array.isArray(answers)) {
    return res.status(400).json({error: "Invalid submission"});
  }
  submissions.push({quizId, studentName, answers, timestamp: new Date()});
  res.json({message: "Submission received"});
});

// Get all submissions for a quiz (GET /api/submit?quizId=...)
app.get('/api/submit', (req, res) => {
  const quizId = req.query.quizId;
  if(!quizId) return res.status(400).json({error: "Quiz ID required"});
  res.json(submissions.filter(s => s.quizId === quizId));
});

// Secure endpoint: clear all data (POST /api/clear)
app.post('/api/clear', (req, res) => {
  if (req.body.password !== TEACHER_PASSWORD) {
    return res.status(401).json({error: "Unauthorized"});
  }
  quizzes = [];
  submissions = [];
  res.json({message: "All data cleared"});
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
