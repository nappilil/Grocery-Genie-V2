import request from 'supertest';
import express from 'express';
import session from 'express-session';
import groceryListRouter from './__mocks__/groceryRoute.js';

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
app.use('/groceryLists', groceryListRouter);

describe('Grocery List Routes (mocked)', () => {
  test('GET /groceryLists/new renders form', async () => {
    const res = await request(app).get('/groceryLists/new');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('groceryList/new');
  });

  test('POST /groceryLists/new fails with missing fields', async () => {
    const res = await request(app).post('/groceryLists/new').send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /groceryLists/new redirects on valid data', async () => {
    const res = await request(app).post('/groceryLists/new').send({
      groceryName: 'Test List',
      listType: 'Personal'
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('/items/createItem');
  });

  test('GET /groceryLists/:id shows list', async () => {
    const res = await request(app).get('/groceryLists/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('groceryList/single');
  });

  test('POST /groceryLists/:id adds comment', async () => {
    const res = await request(app).post('/groceryLists/123').send({
      comment: 'Great apples',
      itemId: 'item456'
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/groceryLists/123');
  });

  test('GET /groceryLists/edit/:id loads edit form', async () => {
    const res = await request(app).get('/groceryLists/edit/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('groceryList/edit');
  });

  test('POST /groceryLists/edit/:id submits edit form', async () => {
    const res = await request(app).post('/groceryLists/edit/123').send({
      groceryName: 'Updated List',
      listType: 'Community'
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/users/profile');
  });

  test('GET /groceryLists/delete/:id loads delete view', async () => {
    const res = await request(app).get('/groceryLists/delete/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('groceryList/delete');
  });

  test('POST /groceryLists/delete/:id deletes list', async () => {
    const res = await request(app).post('/groceryLists/delete/123');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/users/profile');
  });
});
