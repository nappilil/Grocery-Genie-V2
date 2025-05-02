import request from 'supertest';
import express from 'express';
import session from 'express-session';
import usersRouter from './__mocks__/userRouter.js'; // 👈 using mocked route

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({ secret: 'test', resave: false, saveUninitialized: true })
);
app.use((req, res, next) => {
  req.csrfToken = () => 'fake-csrf-token';
  res.render = (view, options) => {
    res.status(200).json({ view, options });
  };
  next();
});
app.use('/users', usersRouter);

describe('User Routes (mocked)', () => {
  test('GET /users/signup works', async () => {
    const res = await request(app).get('/users/signup');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('landing/signup');
  });

  test('POST /users/signup fails with no data', async () => {
    const res = await request(app).post('/users/signup').send({});
    expect(res.statusCode).toBe(400);
  });

  test('GET /users/login works', async () => {
    const res = await request(app).get('/users/login');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('landing/login');
  });

  test('POST /users/login fails with no data', async () => {
    const res = await request(app).post('/users/login').send({});
    expect(res.statusCode).toBe(400);
  });

  test('GET /users/profile redirects if not logged in', async () => {
    const res = await request(app).get('/users/profile');
    expect([401, 302, 403]).toContain(res.statusCode); // depending on how auth is enforced
  });

  test('POST /users/profile fails with empty comment', async () => {
    const res = await request(app).post('/users/profile').send({
      comment: '   ',
      announcementId: '123'
    });
    expect([400, 302, 403]).toContain(res.statusCode); // varies by session handling
  });

  test('GET /users/logout logs out the user', async () => {
    const agent = request.agent(app);
    await agent.get('/users/logout').expect(200); // session destroyed
  });
});