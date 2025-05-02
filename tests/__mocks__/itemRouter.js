import express from 'express';

const router = express.Router();

router.get('/createItem', (req, res) => {
  res.status(200).json({
    view: 'items/new',
    listId: req.query.listId || 'mockList',
    csrfToken: 'mock-token'
  });
});

router.post('/createItem', (req, res) => {
  const { itemName, quantity, priority, category } = req.body;
  if (!itemName || !quantity || !priority || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  res.redirect(`/items/createItem?listId=${req.body.listId || 'mockList'}`);
});

router.get('/increaseQ/:id', (req, res) => {
  if (!req.params.id || !req.query.listId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  res.redirect(`/groceryLists/${req.query.listId}`);
});

router.get('/editItem/:id', (req, res) => {
  res.status(200).json({
    view: 'items/edit',
    itemId: req.params.id,
    listId: req.query.listId,
    oldData: {
      itemName: 'Bread',
      quantity: 1,
      priority: 'High',
      category: 'Bakery',
      comments: 'Whole wheat'
    },
    csrfToken: 'mock-token'
  });
});

router.post('/editItem/:id', (req, res) => {
  const { itemName, quantity, priority, category } = req.body;
  if (!itemName || !quantity || !priority || !category) {
    return res.status(400).json({ error: 'Validation error' });
  }
  res.redirect(`/groceryLists/${req.query.listId}`);
});

router.get('/deleteItem/:id', (req, res) => {
  res.status(200).json({
    view: 'items/delete',
    itemId: req.params.id,
    listId: req.query.listId,
    csrfToken: 'mock-token'
  });
});

router.post('/deleteItem/:id', (req, res) => {
  res.redirect(`/groceryLists/${req.query.listId}`);
});

export default router;