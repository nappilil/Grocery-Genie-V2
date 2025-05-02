import express from 'express';

const router = express.Router();

router.get('/new', (req, res) => {
  res.status(200).json({ view: 'household/new', authenticated: true });
});

router.get('/info', (req, res) => {
  const user = req.session.user;
  if (!user?.householdName) {
    return res.status(403).json({ error: 'User not in household' });
  }
  res.status(200).json({
    view: 'household/info',
    members: ['User A', 'User B'],
    groceryLists: ['List A', 'List B'],
    house: { householdName: user.householdName }
  });
});

router.get('/create', (req, res) => {
  res.status(200).json({ view: 'household/create', authenticated: true });
});

router.post('/create', (req, res) => {
  const { householdName } = req.body;
  if (!householdName) {
    return res.status(400).json({ error: 'Missing household name' });
  }
  req.session.user.householdName = householdName;
  return res.redirect('/household/info');
});

router.get('/join', (req, res) => {
  res.status(200).json({ view: 'household/join' });
});

router.post('/join', (req, res) => {
  const { householdName } = req.body;
  if (!householdName) {
    return res.status(400).json({ error: 'Missing household name' });
  }
  req.session.user.householdName = householdName;
  return res.redirect('/household/info');
});

router.get('/searchLists', (req, res) => {
  const { itemName } = req.query;
  if (!itemName) {
    return res.status(400).json({ error: 'No search term' });
  }
  res.status(200).json({
    view: 'household/searchResults',
    searchQuery: itemName.toLowerCase(),
    matchingLists: [{ listName: 'Mock List', items: ['apple', 'banana'] }]
  });
});

export default router;
