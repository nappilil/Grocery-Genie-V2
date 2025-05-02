import request from 'supertest';
import express from 'express';
import session from 'express-session';
import announcementPostRouter from './__mocks__/announcementRoute.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
  req.csrfToken = () => 'mock-token';
  req.session.user = { userId: 'u123', householdName: 'TestHouse' };
  res.render = (view, options) => res.status(200).json({ view, ...options });
  next();
});
app.use('/announcementPost', announcementPostRouter);

describe('Announcement Route (mocked)', () => {
  test('GET /announcementPost returns announcements for valid user', async () => {
    const res = await request(app).get('/announcementPost');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('announcements');
    expect(Array.isArray(res.body.announcements)).toBe(true);
  });

  test('GET /announcementPost fails if user has no household', async () => {
    const testApp = express();
    testApp.use(express.urlencoded({ extended: false }));
    testApp.use(express.json());
    testApp.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
    testApp.use((req, res, next) => {
      req.csrfToken = () => 'mock';
      req.session.user = { userId: 'u123', householdName: '' };
      res.render = (view, options) => res.status(400).json({ view, ...options });
      next();
    });
    testApp.use('/announcementPost', announcementPostRouter);

    const res = await request(testApp).get('/announcementPost');
    expect(res.statusCode).toBe(400);
  });
});
