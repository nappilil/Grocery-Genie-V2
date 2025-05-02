import express from 'express';

const router = express.Router();

router.get('/signup', (req, res) => {
  res.status(200).json({ view: 'landing/signup', csrfToken: 'mock' });
});

// POST /signup
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, password, age } = req.body;
  if (!firstName || !lastName || !email || !password || !age) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  req.session.user = {
    firstName,
    lastName,
    email,
    age,
    householdName: ''
  };
  res.status(200).json({ redirect: '/household/new' });
});

// GET /login
router.get('/login', (req, res) => {
  res.status(200).json({ view: 'landing/login', csrfToken: 'mock' });
});

// POST /login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  req.session.user = {
    firstName: 'Mock',
    lastName: 'User',
    email,
    age: 30,
    householdName: ''
  };
  res.status(200).json({ redirect: '/household/new' });
});

// GET /profile
router.get('/profile', (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(403).json({ error: 'Not logged in' });
  }
  res.status(200).json({
    view: 'users/profile',
    user,
    groceryList: [],
    csrfToken: 'mock'
  });
});

// POST /profile (post a comment)
router.post('/profile', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Not logged in' });

  const { comment } = req.body;
  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Empty comment' });
  }
  res.status(200).json({ success: true });
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ view: 'users/logout', message: 'Logged out' });
});

export default router;