import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

let mongod, connection, db;
let groceryListData;

import * as mongo from '../config/mongoCollections.js';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  mongo.users = async () => db.collection('users');
  mongo.household = async () => db.collection('household');
  mongo.groceryLists = async () => db.collection('groceryLists');
  mongo.announcements = async () => db.collection('announcements');

  const mod = await import('../data/groceryList.js');
  groceryListData = mod.default;

  const userMod = await import('../data/users.js');
  userMod.default.getUserById = async (id) => {
    return await db.collection('users').findOne({ _id: new ObjectId(id) });
  };
});


afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('users').deleteMany({});
  await db.collection('household').deleteMany({});
  await db.collection('groceryLists').deleteMany({});
  await db.collection('announcements').deleteMany({});
});

test('newGroceryList creates a grocery list', async () => {
  const userId = new ObjectId();
  
  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    age: 30,
    email: 'test@example.com',
    householdName: 'Testhouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });
  
  await db.collection('household').insertOne({
    _id: new ObjectId(),
    householdName: 'Testhouse',
    groceryLists: [],
    members: ['Test User']
  });

  const result = await groceryListData.newGroceryList(
    userId.toString(), 'Testhouse', 'Groceries', 'community'
  );

  expect(result).toBeDefined();
  expect(result.groceryName).toBe('Groceries');
});

test('getAllGroceryLists returns all lists', async () => {
  await db.collection('groceryLists').insertOne({ groceryName: 'Groceries' });
  const lists = await groceryListData.getAllGroceryLists();
  expect(lists.length).toBeGreaterThan(0);
});

test('getGroceryList retrieves a list by ID', async () => {
  const inserted = await db.collection('groceryLists').insertOne({ groceryName: 'Groceries' });
  const list = await groceryListData.getGroceryList(inserted.insertedId.toString());
  expect(list.groceryName).toBe('Groceries');
});

test('updateGroceryList updates list name and type', async () => {
  const userId = new ObjectId();

  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    age: 30,
    householdName: 'TestHouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });
  
  
  const inserted = await db.collection('groceryLists').insertOne({
    userId: userId.toString(),
    groceryName: 'Old Name',
    listType: 'community',
    userName: 'Test User',
    items: [],
    dateCreated: new Date().toLocaleString()
  });

  const updated = await groceryListData.updateGroceryList(
    inserted.insertedId.toString(),
    'New Name',
    'personal',
    userId.toString()
  );

  expect(updated.groceryName).toBe('New Name');
  expect(updated.listType).toBe('personal');
});

test('deleteGroceryList removes a grocery list', async () => {
  const userId = new ObjectId();
  const listId = new ObjectId();
  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse',
    groceryLists: [listId.toString()]
  });
  await db.collection('household').insertOne({
    _id: new ObjectId(),
    householdName: 'Testhouse',
    groceryLists: [listId.toString()]
  });
  await db.collection('groceryLists').insertOne({
    _id: listId,
    userId: userId.toString(),
    groceryName: 'Groceries',
    listType: 'community',
    userName: 'Test User',
    items: [],
    dateCreated: new Date().toLocaleString()
  });

  const result = await groceryListData.deleteGroceryList(
    listId.toString(), 'Testhouse', userId.toString()
  );

  expect(result.groceryListDeleted).toBe(true);
});