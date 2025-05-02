import express from 'express';

const router = express.Router();

router.get('/new', (req, res) => {
  res.status(200).json({ view: 'groceryList/new', csrfToken: 'mock' });
});

router.post('/new', (req, res) => {
  const { groceryName, listType } = req.body;
  if (!groceryName || !listType) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  res.redirect('/items/createItem?listId=mockListId');
});

router.get('/:id', (req, res) => {
  if (req.params.id === 'error') {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  res.status(200).json({
    view: 'groceryList/single',
    listId: req.params.id,
    csrfToken: 'mock'
  });
});

router.post('/:id', (req, res) => {
  const { comment, itemId } = req.body;
  if (!comment || !itemId) {
    return res.status(400).json({ error: 'Missing comment or itemId' });
  }
  res.redirect(`/groceryLists/${req.params.id}`);
});

router.get('/edit/:id', (req, res) => {
  res.status(200).json({
    view: 'groceryList/edit',
    listId: req.params.id,
    groceryList: { groceryName: 'Sample', listType: 'Community' }
  });
});

router.post('/edit/:id', (req, res) => {
  const { groceryName, listType } = req.body;
  if (!groceryName || !listType) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  res.redirect('/users/profile');
});

router.get('/delete/:id', (req, res) => {
  res.status(200).json({
    view: 'groceryList/delete',
    listId: req.params.id,
    groceryList: { groceryName: 'Sample' }
  });
});

router.post('/delete/:id', (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Missing ID' });
  }
  res.redirect('/users/profile');
});

export default router;