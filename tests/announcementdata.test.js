import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

let mongod, connection, db;
let announcementData;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  connection = await MongoClient.connect(uri);
  db = connection.db('testdb');

  const mockModule = await import('../config/mongoCollections.js');
  mockModule.announcements = async () => db.collection('announcements');
  mockModule.users = async () => db.collection('users');

  const mod = await import('../data/announcementPost.js');
  announcementData = mod.default;
});

afterAll(async () => {
  await connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await db.collection('announcements').deleteMany({});
  await db.collection('users').deleteMany({});
});

describe('announcementData module', () => {
  test('newAnnouncement inserts with required fields', async () => {
    const res = await announcementData.newAnnouncement(
      'Added item',
      'Peanut butter added',
      new ObjectId().toString(),
      'MockHouse'
    );
    expect(res).toEqual({ inserted: true });

    const doc = await db.collection('announcements').findOne({});
    expect(doc.comment).toBe('Peanut butter added');
  });

  test('getAllAnnouncementsByHouseholdName returns reversed list', async () => {
    await db.collection('announcements').insertMany([
      { householdName: 'MockHouse', comment: 'First', currentDate: '1' },
      { householdName: 'MockHouse', comment: 'Second', currentDate: '2' }
    ]);
    const res = await announcementData.getAllAnnouncementsByHouseholdName('MockHouse');
    expect(res.length).toBe(2);
    expect(res[0].comment).toBe('Second'); // reversed
  });

  test('deleteOldAnnouncement deletes the doc', async () => {
    const insert = await db.collection('announcements').insertOne({
      householdName: 'MockHouse',
      comment: 'To delete'
    });
    const res = await announcementData.deleteOldAnnouncement(insert.insertedId.toString());
    expect(res).toEqual({ deleted: true });
  });

  test('getAnnouncementById returns the doc', async () => {
    const insert = await db.collection('announcements').insertOne({
      householdName: 'MockHouse',
      comment: 'To find'
    });
    const res = await announcementData.getAnnouncementById(insert.insertedId.toString());
    expect(res.comment).toBe('To find');
  });

  test('updateAnnouncement updates comment in both collections', async () => {
    const userId = new ObjectId();
    const announcementId = new ObjectId();

    const announcement = {
      _id: announcementId,
      comment: 'Old',
      groceryList: 'List A',
      groceryItem: 'Milk',
      action: 'Added',
      householdName: 'MockHouse',
      currentDate: 'Now',
      userId: userId
    };

    await db.collection('announcements').insertOne(announcement);
    await db.collection('users').insertOne({
      _id: userId,
      announcements: [announcement]
    });

    const res = await announcementData.updateAnnouncement(
      announcementId.toString(),
      'Updated comment'
    );

    expect(res.comment).toBe('Updated comment');

    const updatedInUser = await db.collection('users').findOne({ _id: userId });
    expect(updatedInUser.announcements[0].comment).toBe('Updated comment');
  });
});
