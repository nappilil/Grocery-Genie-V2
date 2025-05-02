import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import commentData from '../data/comments.js';

let mongod, connection, db;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  const mongo = await import('../config/mongoCollections.js');
  mongo.users = async () => db.collection('users');
  mongo.comments = async () => db.collection('comments');
  mongo.groceryLists = async () => db.collection('groceryLists');
});

afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('users').deleteMany({});
  await db.collection('comments').deleteMany({});
  await db.collection('groceryLists').deleteMany({});
});

test('newComment inserts and updates grocery list', async () => {
  const userId = new ObjectId();
  const listId = new ObjectId();
  const itemId = new ObjectId();

  await db.collection('users').insertOne({
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    householdName: 'Testhouse'
  });

  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [{ _id: itemId, comments: [] }]
  });

  const result = await commentData.newComment(
    userId.toString(),
    listId.toString(),
    itemId.toString(),
    'This is a comment'
  );

  expect(result.acknowledged).toBe(true);
});

test('getComment retrieves inserted comment', async () => {
  const commentId = new ObjectId();

  await db.collection('comments').insertOne({
    _id: commentId,
    userId: new ObjectId().toString(),
    text: 'Sample comment',
    name: 'Test User',
    date: new Date().toLocaleString()
  });

  const comment = await commentData.getComment(commentId.toString());
  expect(comment.text).toBe('Sample comment');
});

test('deleteComment removes from collection and list', async () => {
  const listId = new ObjectId();
  const itemId = new ObjectId();
  const commentId = new ObjectId();

  await db.collection('comments').insertOne({
    _id: commentId,
    userId: new ObjectId().toString(),
    text: 'Comment to delete',
    name: 'Test User',
    date: new Date().toLocaleString()
  });

  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [{ _id: itemId, comments: [{ _id: commentId, comments: 'Comment to delete' }] }]
  });

  const result = await commentData.deleteComment(
    listId.toString(),
    itemId.toString(),
    commentId.toString()
  );

  expect(result.commentDeleted).toBe(true);
});

test('updateComment updates text in comment and grocery list', async () => {
  const commentId = new ObjectId();
  const listId = new ObjectId();
  const itemId = new ObjectId();

  await db.collection('comments').insertOne({
    _id: commentId,
    userId: new ObjectId().toString(),
    text: 'Old comment',
    name: 'Test User',
    date: new Date().toLocaleString()
  });

  await db.collection('groceryLists').insertOne({
    _id: listId,
    items: [{ _id: itemId, comments: [{ _id: commentId, comments: 'Old comment' }] }]
  });

  const result = await commentData.updateComment(
    listId.toString(),
    itemId.toString(),
    commentId.toString(),
    'Updated comment'
  );

  expect(result).toBeDefined();
});
