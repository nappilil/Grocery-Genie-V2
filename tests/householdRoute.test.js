import request from 'supertest';
import express from 'express';
import session from 'express-session';
import householdRouter from './__mocks__/householdRouter.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
  req.csrfToken = () => 'mock';
  res.render = (view, options) => res.status(200).json({ view, options });
  req.session.user = {
    userId: 'u123',
    householdName: ''
  };
  next();
});
app.use('/household', householdRouter);

describe('Household Routes (mocked)', () => {
  test('GET /household/new renders form', async () => {
    const res = await request(app).get('/household/new');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('household/new');
  });

  test('GET /household/info returns info if user in household', async () => {
    const testApp = express();
    testApp.use(express.urlencoded({ extended: false }));
    testApp.use(express.json());
    testApp.use(
      session({ secret: 'test', resave: false, saveUninitialized: true })
    );
  
    //adding in a mock user
    testApp.use((req, res, next) => {
      req.session.user = {
        userId: 'u123',
        householdName: 'TestHouse'
      };
      req.csrfToken = () => 'mock';
      res.render = (view, options) =>
        res.status(200).json({ view, ...options });
      next();
    });
  
    testApp.use('/household', householdRouter);
  
    const res = await request(testApp).get('/household/info');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('household/info');
    expect(res.body.house.householdName).toBe('TestHouse');
  });
  
  test('POST /household/create redirects with valid input', async () => {
    const res = await request(app).post('/household/create').send({
      householdName: 'TestHouse'
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/household/info');
  });

  test('POST /household/create fails with missing input', async () => {
    const res = await request(app).post('/household/create').send({});
    expect(res.statusCode).toBe(400);
  });

  test('GET /household/join renders join form', async () => {
    const res = await request(app).get('/household/join');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('household/join');
  });

  test('POST /household/join works with valid household name', async () => {
    const res = await request(app).post('/household/join').send({
      householdName: 'TestHouse'
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/household/info');
  });

  test('GET /household/searchLists returns search results', async () => {
    const res = await request(app).get('/household/searchLists?itemName=apple');
    expect(res.statusCode).toBe(200);
    expect(res.body.searchQuery).toBe('apple');
    expect(res.body.matchingLists.length).toBeGreaterThan(0);
  });
});
