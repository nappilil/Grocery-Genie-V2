
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

let mongod, connection, db;
let userData;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  const mongo = await import('../config/mongoCollections.js');
  mongo.users = async () => db.collection('users');
  mongo.household = async () => db.collection('household');

  const mod = await import('../data/users.js');
  userData = mod.default;
});

afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('users').deleteMany({});
  await db.collection('household').deleteMany({});
});

test('addUser successfully inserts a user', async () => {
  const result = await userData.addUser(
    'testuser@example.com',
    'StrongP@ssw0rd!',
    'Alice',
    'Smith',
    25
  );

  expect(result).toBeDefined();
  expect(result.email).toBe('testuser@example.com');
  expect(result.firstName).toBe('Alice');
});

test('logInUser logs in the user with correct credentials', async () => {
  const password = 'StrongP@ssw0rd!';
  const hashedPassword = await bcrypt.hash(password, 8);

  const userId = await db.collection('users').insertOne({
    email: 'login@example.com',
    hashedPassword,
    firstName: 'Bob',
    lastName: 'Jones',
    age: 30,
    householdName: '',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  const loggedIn = await userData.logInUser('login@example.com', password);
  expect(loggedIn.firstName).toBe('Bob');
});

test('getUserById returns the correct user', async () => {
  const inserted = await db.collection('users').insertOne({
    email: 'findme@example.com',
    hashedPassword: await bcrypt.hash('password', 8),
    firstName: 'Charlie',
    lastName: 'Day',
    age: 40,
    householdName: '',
    groceryLists: [],
    announcements: [],
    comments: []
  });

  const user = await userData.getUserById(inserted.insertedId.toString());
  expect(user.email).toBe('findme@example.com');
});

test('getAllUsers returns user names only', async () => {
  await db.collection('users').insertMany([
    { firstName: 'Dana', lastName: 'Scully', email: 'dana@example.com', hashedPassword: 'hash', age: 35, householdName: '', groceryLists: [], announcements: [], comments: [] },
    { firstName: 'Fox', lastName: 'Mulder', email: 'fox@example.com', hashedPassword: 'hash', age: 37, householdName: '', groceryLists: [], announcements: [], comments: [] }
  ]);

  const users = await userData.getAllUsers();
  expect(users).toContain('Dana Scully');
  expect(users).toContain('Fox Mulder');
});
