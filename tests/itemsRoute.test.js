import request from 'supertest';
import express from 'express';
import session from 'express-session';
import itemsRouter from './__mocks__/itemRouter.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
  req.csrfToken = () => 'mock';
  res.render = (view, options) => res.status(200).json({ view, options });
  next();
});
app.use('/items', itemsRouter);

describe('Items Routes (mocked)', () => {
  test('GET /items/createItem renders form', async () => {
    const res = await request(app).get('/items/createItem?listId=abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('items/new');
    expect(res.body.listId).toBe('abc');
  });

  test('POST /items/createItem fails with missing data', async () => {
    const res = await request(app).post('/items/createItem').send({});
    expect(res.statusCode).toBe(400);
  });

  test('GET /items/increaseQ/:id redirects to list', async () => {
    const res = await request(app).get('/items/increaseQ/xyz?listId=abc');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/groceryLists/abc');
  });

  test('GET /items/editItem/:id returns old data', async () => {
    const res = await request(app).get('/items/editItem/123?listId=abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.oldData.itemName).toBe('Bread');
  });

  test('POST /items/editItem/:id fails on missing fields', async () => {
    const res = await request(app).post('/items/editItem/123?listId=abc').send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /items/editItem/:id redirects on valid input', async () => {
    const res = await request(app)
      .post('/items/editItem/123?listId=abc')
      .send({
        itemName: 'Apples',
        quantity: 3,
        priority: 'High',
        category: 'Fruits'
      });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/groceryLists/abc');
  });

  test('GET /items/deleteItem/:id returns delete view', async () => {
    const res = await request(app).get('/items/deleteItem/123?listId=abc');
    expect(res.statusCode).toBe(200);
    expect(res.body.view).toBe('items/delete');
  });

  test('POST /items/deleteItem/:id redirects to grocery list', async () => {
    const res = await request(app).post('/items/deleteItem/123?listId=abc');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/groceryLists/abc');
  });
});