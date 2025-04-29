import {Router} from 'express';
const router = Router();
import {announcementData} from '../data/index.js';
import {checkString, checkComment} from '../validation.js';

router.route('/')
  .get(async (req, res) => {
    const user = req.session.user;
    try { // extra error checking
      user.householdName = checkString(user.householdName);
    } catch (e) {
      res.status(400).render('error', 
      {pageTitle: "Error",
      authenticated: true,
      household: true,
      error: e
    })
    return;
    }
    const announcements = await announcementData.getAllAnnouncementsByHouseholdName(user.householdName);
    res.status(200).render('announcements', 
    {pageTitle: "Announcements",
    authenticated: true,
    household: true,
    announcements
  })
})

export default router;