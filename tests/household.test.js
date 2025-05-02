// tests/household.test.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

let mongod, connection, db;
let householdData;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  const mongo = await import('../config/mongoCollections.js');
  mongo.users = async () => db.collection('users');
  mongo.household = async () => db.collection('household');
  mongo.announcements = async () => db.collection('announcements');

  const userMod = await import('../data/users.js');
  userMod.default.getUserById = async (id) => ({
    _id: new ObjectId(id),
    firstName: 'Test',
    lastName: 'User',
    householdName: '',
    groceryLists: []
  });

  const mod = await import('../data/household.js');
  householdData = mod.default;
});

afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('users').deleteMany({});
  await db.collection('household').deleteMany({});
  await db.collection('announcements').deleteMany({});
});

test('createHousehold creates a new household', async () => {
  const userId = new ObjectId();
  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: ''
  });

  const result = await householdData.createHousehold('HouseTest', userId.toString());
  expect(result.householdName).toBe('Housetest');
});

test('joinHousehold adds a user to a household', async () => {
  const userId = new ObjectId();
  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: ''
  });

  await db.collection('household').insertOne({
    householdName: 'Housetest',
    members: [],
    groceryLists: [],
    shopper: '',
    shopperAssigned: new Date()
  });

  const result = await householdData.joinHousehold('HouseTest', userId.toString());
  expect(result.householdName).toBe('Housetest');
});

test('getHouseholdByName retrieves a household', async () => {
  await db.collection('household').insertOne({
    householdName: 'Findme',
    members: [],
    groceryLists: [],
    shopper: '',
    shopperAssigned: new Date()
  });

  const result = await householdData.getHouseholdByName('FindMe');
  expect(result.householdName).toBe('Findme');
});

test('rotateShopper does not throw and returns object', async () => {
  await db.collection('household').insertOne({
    householdName: 'Spincycle',
    members: ['Test User'],
    groceryLists: [],
    shopper: 'Test User',
    shopperAssigned: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // more than 1 week ago
  });

  const result = await householdData.rotateShopper();
  expect(result.rotateShopper).toBe(true);
});
