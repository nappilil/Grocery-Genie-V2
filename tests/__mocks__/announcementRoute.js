import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const user = req.session.user;
  if (!user || !user.householdName) {
    return res.status(400).json({ error: 'Invalid or missing household name' });
  }

  res.status(200).json({
    view: 'announcements',
    announcements: [
      { message: 'Mock announcement 1' },
      { message: 'Mock announcement 2' }
    ]
  });
});

export default router;