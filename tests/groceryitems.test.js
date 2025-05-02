import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

let mongod, connection, db;
let itemData;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  const mongo = await import('../config/mongoCollections.js');
  mongo.groceryLists = async () => db.collection('groceryLists');
  mongo.users = async () => db.collection('users');
  mongo.announcements = async () => db.collection('announcements');

  const userMod = await import('../data/users.js');
  userMod.default.getUserById = async (id) => ({
    _id: new ObjectId(id),
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  const groceryMod = await import('../data/groceryList.js');
  groceryMod.default.getGroceryList = async (id) =>
    await db.collection('groceryLists').findOne({ _id: new ObjectId(id) });

  const mod = await import('../data/groceryListItems.js');
  itemData = mod.default;
});

afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('groceryLists').deleteMany({});
  await db.collection('users').deleteMany({});
  await db.collection('announcements').deleteMany({});
});

test('newItem adds a new grocery item to list', async () => {
  const userId = new ObjectId();
  const listId = new ObjectId();

  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  await db.collection('groceryLists').insertOne({
    _id: listId,
    userId: userId.toString(),
    groceryName: 'Test List',
    userName: 'Test User',
    listType: 'community',
    items: [],
    dateCreated: new Date().toLocaleString()
  });

  const result = await itemData.newItem(
    userId.toString(),
    listId.toString(),
    'Apples',
    3,
    'high',
    'fruit',
    ''
  );

  expect(result).toBeDefined();
  expect(result.items.length).toBe(1);
  expect(result.items[0].itemName).toBe('Apples');
});

test('getAllItems returns sorted items', async () => {
  const listId = new ObjectId();
  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [
      { _id: new ObjectId(), itemName: 'Bread', priority: 'Low' },
      { _id: new ObjectId(), itemName: 'Apples', priority: 'High' },
      { _id: new ObjectId(), itemName: 'Milk', priority: 'Medium' }
    ]
  });

  const result = await itemData.getAllItems(listId.toString());
  expect(result.map(i => i.itemName)).toEqual(['Apples', 'Milk', 'Bread']);
});

test('getItemById retrieves item', async () => {
  const itemId = new ObjectId();
  await db.collection('groceryLists').insertOne({
    items: [
      { _id: itemId, itemName: 'Cheese', priority: 'Low', comments: [] }
    ]
  });

  const result = await itemData.getItemById(itemId.toString());
  expect(result.itemName).toBe('Cheese');
});

test('getItem retrieves item by name', async () => {
  const listId = new ObjectId();
  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [
      { _id: new ObjectId(), itemName: 'Carrots', priority: 'High', comments: [] }
    ]
  });

  const result = await itemData.getItem(listId.toString(), 'Carrots');
  expect(result.itemName).toBe('Carrots');
});

test('deleteLItem deletes item from list', async () => {
  const listId = new ObjectId();
  const itemId = new ObjectId();
  const userId = new ObjectId();

  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [
      { _id: itemId, itemName: 'Oranges', priority: 'Low', comments: [] }
    ]
  });

  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  const result = await itemData.deleteLItem(listId.toString(), itemId.toString(), userId.toString());
  expect(result.groceryItemDeleted).toBe(true);
});

test('updateItem updates item details', async () => {
  const itemId = new ObjectId();
  const listId = new ObjectId();
  const userId = new ObjectId();

  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [
      { _id: itemId, itemName: 'Tomatoes', quantity: 1, priority: 'Medium', category: 'Veggies', comments: [] }
    ]
  });

  const result = await itemData.updateItem(itemId.toString(), {
    itemName: 'Tomatoes',
    quantity: 2,
    priority: 'High',
    category: 'Vegetables'
  }, userId.toString());

  const updated = result.items.find(i => i._id.toString() === itemId.toString());
  expect(updated.quantity).toBe(2);
  expect(updated.priority).toBe('High');
  expect(updated.category).toBe('Vegetables');
});
