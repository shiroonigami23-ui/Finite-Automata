const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const usersFile = path.join(dataDir, 'users.json');
const commentsFile = path.join(dataDir, 'comments.json');
const votesFile = path.join(dataDir, 'votes.json');
const filesFile = path.join(dataDir, 'files.json');

const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Helpers
function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Failed loading ${filePath}:`, e);
  }
  return [];
}
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed saving ${filePath}:`, e);
  }
}

// Load all data on start
let users = loadData(usersFile);
let comments = loadData(commentsFile);
let votes = loadData(votesFile);
let files = loadData(filesFile);

const ADMINPASSWORD = process.env.ADMIN_PASSWORD || 'Shiro';

const allowedTypes = [
  'application/pdf',
  'application/epub+zip',
  'audio/mpeg',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const maxFileSize = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => cb(null, allowedTypes.includes(file.mimetype)),
});

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

function getAdminByIdAndPassword(id, password) {
  return users.find(u => u.id === id && u.isAdmin && password === ADMINPASSWORD);
}

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMINPASSWORD) {
    let existingAdmin = users.find(u => u.name === 'admin');
    if (!existingAdmin) {
      existingAdmin = {
        id: genId(),
        name: 'admin',
        isAdmin: true,
        isAnonymous: false,
      };
      users.push(existingAdmin);
      saveData(usersFile, users);
    }
    return res.json(existingAdmin);
  }
  res.status(403).json({ error: 'Admin login failed' });
});

app.post('/login', (req, res) => {
  const { name, password, isAnonymous } = req.body;
  if (isAnonymous) {
    const anonUser = {
      id: genId(),
      name: `Anonymous${genId()}`,
      isAdmin: false,
      isAnonymous: true,
    };
    users.push(anonUser);
    saveData(usersFile, users);
    return res.json(anonUser);
  }
  if (!name) return res.status(400).json({ error: 'Name required' });

  const isAdmin = name.toLowerCase() === 'admin' && password === ADMINPASSWORD;
  const user = {
    id: genId(),
    name,
    isAdmin,
    isAnonymous: false,
  };
  users.push(user);
  saveData(usersFile, users);
  res.json(user);
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { uploaderId, uploaderName, isAnonymous } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!uploaderId && !(isAnonymous === 'true' || isAnonymous === true) && !uploaderName)
    return res.status(400).json({ error: 'Uploader info required' });

  const fileMeta = {
    id: req.file.filename,
    originalName: req.file.originalname,
    uploaderId: uploaderId || null,
    uploaderName: uploaderName || null,
    isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    isApproved: false,
    createdAt: new Date(),
    upvotes: 0,
  };
  files.push(fileMeta);
  saveData(filesFile, files);

  res.json({ success: true, file: fileMeta });
});

app.post('/admin/approve', (req, res) => {
  const { fileId, adminId, adminPassword } = req.body;
  if (!getAdminByIdAndPassword(adminId, adminPassword))
    return res.status(403).json({ error: 'Admin only or wrong password' });

  const file = files.find(f => f.id === fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (file.isApproved) return res.status(400).json({ error: 'File already approved' });

  file.isApproved = true;
  saveData(filesFile, files);
  res.json({ success: true });
});

app.post('/admin/reject', (req, res) => {
  const { fileId, adminId, adminPassword } = req.body;
  if (!getAdminByIdAndPassword(adminId, adminPassword))
    return res.status(403).json({ error: 'Admin only or wrong password' });

  const fileIndex = files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

  try {
    fs.unlinkSync(path.join(uploadsDir, files[fileIndex].id));
  } catch (e) {}

  files.splice(fileIndex, 1);
  saveData(filesFile, files);
  res.json({ success: true });
});

app.get('/download/:fileId/:userId', (req, res) => {
  const { fileId, userId } = req.params;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(403).json({ error: 'User not found' });

  const file = files.find(f => f.id === fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });
  
  const filePath = path.join(uploadsDir, fileId);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  res.download(filePath, file.originalName);
});

app.post('/upvote', (req, res) => {
  const { userId, fileId } = req.body;
  const user = users.find(u => u.id === userId);
  const file = files.find(f => f.id === fileId);
  if (!user || !file) return res.status(400).json({ error: 'Invalid user or file' });

  const existingVote = votes.find(v => v.userId === userId && v.fileId === fileId);
  if (existingVote) return res.status(400).json({ error: 'User already voted' });

  const vote = { id: genId(), userId, fileId, date: new Date() };
  votes.push(vote);
  saveData(votesFile, votes);

  file.upvotes = (file.upvotes || 0) + 1;
  saveData(filesFile, files);

  res.json({ success: true, upvotes: file.upvotes });
});

app.get('/files/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(403).json({ error: 'User not found' });

  const visibleFiles = user.isAdmin ? files : files.filter(f => f.isApproved);
  res.json(visibleFiles);
});

app.post('/comment', (req, res) => {
  const { text, authorName, authorId } = req.body;
  if (!text || !authorName) return res.status(400).json({ error: 'Comment or name required' });

  const comment = { id: genId(), text, authorName, authorId: authorId || null, createdAt: new Date() };
  comments.push(comment);
  saveData(commentsFile, comments);
  res.json({ success: true, comment });
});

app.get('/comments', (req, res) => {
  res.json(comments);
});

app.get('/admin/stats/:adminId/:adminPassword', (req, res) => {
  const { adminId, adminPassword } = req.params;
  if (!getAdminByIdAndPassword(adminId, adminPassword))
    return res.status(403).json({ error: 'Admin only or wrong password' });

  res.json({
    totalFiles: files.length,
    approved: files.filter(f => f.isApproved).length,
    pending: files.filter(f => !f.isApproved).length,
    totalUpvotes: votes.length,
  });
});

app.listen(PORT, () => {
  console.log(`ShareLit backend running on port ${PORT}`);
});
