import { users, groceryLists, household, announcements } from "../config/mongoCollections.js";
import { checkHouseholdName, checkId, checkString } from '../validation.js';
import userData from './users.js'
import { ObjectId } from 'mongodb';
const exportedMethods = {
  async newGroceryList(
    userId,
    householdName,
    groceryName,
    listType
  ) {
    if (!userId || !groceryName || !householdName || !listType) {
      throw 'Must provide all fields to update Grocery List';
    }

    userId = checkId(userId, "User ID");
    householdName = checkHouseholdName(householdName, "Household Name");
    groceryName = checkString(groceryName, "Grocery List Name");
    if (listType.toLowerCase() !== 'community')
      if (listType.toLowerCase() !== 'special occasion')
        if (listType.toLowerCase() !== 'personal') {
          throw 'Not a valid list type';
        }
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    let dateCreated = new Date().toLocaleString()
    
    const newList = {
      userId: userId,
      userName: userMember.firstName + " " + userMember.lastName,
      groceryName,
      listType,
      items: [],
      dateCreated
    }

    // check if household exists
    const householdCollection = await household();
    const existingHousehold = await householdCollection.find({ householdName: householdName }).toArray();
    if (existingHousehold.length === 0) throw `Error: Household does not exist`;

    // check if user belongs to that household
    if (userMember.householdName.length === 0) throw `Error: User must belong to a household to make grocery lists`;
    if (userMember.householdName !== householdName) throw `Error: User does not belong to this household`;
    // insert grocery list to collection
    const groceryListCollection = await groceryLists();
    const insertInfo = await groceryListCollection.insertOne(newList);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
      throw 'Error: Could not add grocery list';

    // update household with new grocery list
    let updatedInfo = await householdCollection.findOneAndUpdate(
      { _id: new ObjectId(existingHousehold[0]._id) },
      { $push: { groceryLists: newList._id.toString() } }, // push ID of list to household
      { returnDocument: 'after' }
    );
    if (!updatedInfo) throw 'Error: Could not update household successfully';

    // update user with new grocery list
    const userCollection = await users();
    updatedInfo = await userCollection.findOneAndUpdate(
      { _id: userMember._id },
      { $push: { groceryLists: newList._id.toString() } }, // push ID of list to household
      { returnDocument: 'after' }
    );
    await this.createListAnnouncement(newList._id.toString(), userId); // make announcement
    return newList;
  },

  async getAllGroceryLists() {
    const groceryListCollection = await groceryLists();
    let gList = await groceryListCollection.find({}).toArray();
    if (!gList) {
      throw `Could not get all grocery lists`;
    }
    const listNames = gList.map((element) => element.groceryName);
    return gList;
  },

  async getGroceryList(id) {
    id = checkId(id, "Grocery List Id");
    const groceryListCollection = await groceryLists();
    const gList = await groceryListCollection.findOne({ _id: new ObjectId(id) });
    if (!gList) {
      throw 'Error: List not found.'
    }
    return gList;
  },

  async deleteGroceryList(id, householdName, userId) {
    id = checkId(id, "Grocery List Id");
    householdName = checkHouseholdName(householdName, "Household Name");
    userId = checkId(userId, "User Id");

    let groceryList = await this.getGroceryList(id);
    const userMember = await userData.getUserById(groceryList.userId);
    if (!userMember) throw `User could not be found`;

    const householdCollection = await household();
    const existingHousehold = await householdCollection.find({ householdName: householdName }).toArray();
    if (existingHousehold.length === 0) throw `Error: Household does not exist`;
    let updatedInfo = await householdCollection.findOneAndUpdate(
      { _id: new ObjectId(existingHousehold[0]._id) },
      { $pull: { groceryLists: groceryList._id.toString() } }, // push ID of list from household
      { returnDocument: 'after' }
    );
    if (!updatedInfo) throw 'Error: Could not update household successfully';

    // update user to remove grocery list
    const userCollection = await users();
    updatedInfo = await userCollection.findOneAndUpdate(
      { _id: userMember._id },
      { $pull: { groceryLists: groceryList._id.toString() } }, // pull ID of list from user
      { returnDocument: 'after' }
    );
    if (!updatedInfo) throw 'Error: Could not update user successfully';

    await this.deleteListAnnouncement(id, userId);
    const groceryListCollection = await groceryLists();
    const deleteInfo = await groceryListCollection.findOneAndDelete({ _id: new ObjectId(id) });
    if (!deleteInfo) {
      throw 'Error: Deletion unsuccessful';
    }

    return { groceryListDeleted: true };
  },

  async updateGroceryList(
    listId,
    groceryName,
    listType,
    userId
  ) {
    //    should we make fields optional for update?
    //    if (!userId || !groceryName || !listType) {
    //      throw 'Must provide all fields to update Grocery List';
    //    }
    listId = checkId(listId, "Grocery List Id");
    groceryName = checkString(groceryName, "Grocery List Name");
    userId = checkId(userId, "User Id");
    let currentList = await this.getGroceryList(listId);

    if (groceryName) {
      groceryName = checkString(groceryName, "Grocery Name");
    } else {
      groceryName = currentList.groceryName;
    }

    if (listType) {
      if (listType.trim().toLowerCase() !== 'community')
        if (listType.trim().toLowerCase() !== 'special occasion')
          if (listType.trim().toLowerCase() !== 'personal') {
            throw 'Not a valid list type';
          }
    } else {
      listType = currentList.listType;
    }
    // list type and grocery name are only fields that can be updated
    const updateGroceryList = {
      _id: currentList._id,
      userId: currentList.userId,
      userName: currentList.userName,
      groceryName: groceryName,
      listType: listType,
      items: currentList.items,
      dateCreated: currentList.dateCreated,
    }

    const groceryListCollection = await groceryLists();
    const gList = await groceryListCollection.findOneAndUpdate({ _id: new ObjectId(listId) }, { $set: updateGroceryList }, { returnDocument: 'after' });
    if (!gList) throw 'Error: Could not update list'

    await this.updateListAnnouncement(listId, userId);
    return updateGroceryList;
  },
  async createListAnnouncement(groceryListId, userId) {
    groceryListId = checkId(groceryListId, "Grocery List Id");
    userId = checkId(userId, "User Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await this.getGroceryList(groceryListId);
    if (!groceryList) throw  `Grocery list could not be found`;

    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " created a list called '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), groceryItem = "", comment = "", householdName = userMember.householdName, action='createList';
    currentDate = currentDate.toLocaleDateString()

    const newAnnouncement = {
      action, // might get rid of this 
      groceryList,
      groceryItem,
      comment,
      userId,
      householdName,
      announcement, // added this for text to store in database
      currentDate
    }
    // Insert New Announcement
    const announcementCollection = await announcements();
    const insertInfo = await announcementCollection.insertOne(newAnnouncement);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Error: Could not add announcement';

    // Update user information with new announcement
    const userCollection = await users();
    let updatedInfo = await userCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $push: { announcements: newAnnouncement } },
      { returnDocument: "after" }
    );
    if (!updatedInfo) {
      throw 'Error: Could not update user successfully';
    }
    updatedInfo._id = updatedInfo._id.toString();

    return insertInfo;
  },
  async deleteListAnnouncement(groceryListId, userId) {
    groceryListId = checkId(groceryListId, "Grocery List Id");
    userId = checkId(userId, "User Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await this.getGroceryList(groceryListId);
    if (!groceryList) throw  `Grocery list could not be found`;

    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " deleted a list called '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), groceryItem = "", comment = "", householdName = userMember.householdName, action='deleteList';
    currentDate = currentDate.toLocaleDateString()

    const newAnnouncement = {
      action, // might get rid of this 
      groceryList,
      groceryItem,
      comment,
      userId,
      householdName,
      announcement, // added this for text to store in database
      currentDate
    }
    // Insert New Announcement
    const announcementCollection = await announcements();
    const insertInfo = await announcementCollection.insertOne(newAnnouncement);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Error: Could not add announcement';

    // Update user information with new announcement
    const userCollection = await users();
    let updatedInfo = await userCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $push: { announcements: newAnnouncement } },
      { returnDocument: "after" }
    );
    if (!updatedInfo) {
      throw 'Error: Could not update user successfully';
    }
    updatedInfo._id = updatedInfo._id.toString();
    return insertInfo;
  },
  async updateListAnnouncement(groceryListId, userId) {
    groceryListId = checkId(groceryListId, "Grocery List Id");
    userId = checkId(userId, "User Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await this.getGroceryList(groceryListId);
    if (!groceryList) throw  `Grocery list could not be found`;

    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " edited the list '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), groceryItem = "", comment = "", householdName = userMember.householdName, action='editList';
    currentDate = currentDate.toLocaleDateString()


    const newAnnouncement = {
      action, // might get rid of this 
      groceryList,
      groceryItem,
      comment,
      userId,
      householdName,
      announcement, // added this for text to store in database
      currentDate
    }
    // Insert New Announcement
    const announcementCollection = await announcements();
    const insertInfo = await announcementCollection.insertOne(newAnnouncement);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Error: Could not add announcement';

    // Update user information with new announcement
    const userCollection = await users();
    let updatedInfo = await userCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $push: { announcements: newAnnouncement } },
      { returnDocument: "after" }
    );
    if (!updatedInfo) {
      throw 'Error: Could not update user successfully';
    }
    updatedInfo._id = updatedInfo._id.toString();

    return insertInfo;
  }

};
export default exportedMethods;