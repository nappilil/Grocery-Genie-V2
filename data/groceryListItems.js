import groceryListData from "./groceryList.js";
import { groceryLists, announcements, users } from "../config/mongoCollections.js";
import { checkAge, checkId, checkString } from '../validation.js';
import { ObjectId } from 'mongodb';
import userData from './users.js'

const exportedMethods = {
  async newItem(
    userId,
    listId,
    itemName,
    quantity,
    priority,
    category,
    comments
  ) {
    if (category === undefined) {//comments are optional when initializing an item
      throw `All arguments must be passed`;
    }
    userId = checkId(userId, "User Id");
    listId = checkId(listId, "List Id");
    itemName = checkString(itemName, "Item Name");
    quantity = checkAge(quantity, 'Quantity'); //Just a check is whole number function
    priority = checkString(priority, "Priority");
    if (priority.toLowerCase() !== "low")
      if (priority.toLowerCase() !== 'medium')
        if (priority.toLowerCase() !== 'high')
          throw `Error: invalid priority ranking`;
    category = checkString(category);

    itemName = itemName.slice(0, 1).toUpperCase() + itemName.slice(1).toLowerCase();  // store everything the same
    priority = priority.slice(0, 1).toUpperCase() + priority.slice(1).toLowerCase();  // store everything the same
    category = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();  // store everything the same

    // if no comment supplied just make it an empty field don't get rid of the field
    if (!comments) {
      comments = [];
    } else {
      comments = checkString(comments, "Comments");
    }
    const newItem = {
      _id: new ObjectId(),
      listId: listId,
      itemName: itemName,
      quantity: quantity,
      priority: priority,
      category: category,
      comments: comments
    }

    const groceryListList = await groceryLists();
    let foundItem = await groceryListList.findOne(
      { '_id': new ObjectId(listId), 'items.itemName': itemName },
      { projection: { _id: 1, 'items.$': 1 } }
    );
    let updateInfo;
    if (foundItem === null) {
      updateInfo = await groceryListList.findOneAndUpdate(
        { _id: new ObjectId(listId) },
        { $push: { items: newItem } },
        { returnDocument: 'after' }
      );
    }
    else {
      foundItem = foundItem.items[0];
      quantity = foundItem.quantity + quantity;
      updateInfo = await groceryListList.findOneAndUpdate(
        { 'items._id': new ObjectId(foundItem._id) },
        { $set: { 'items.$.quantity': quantity } },
        { returnDocument: 'after' }
      );
    }
    if (!updateInfo) throw 'Error: update unsuccessful';

    // List is Sorted by Priority
    const sortedItems = await this.getAllItems(listId);
    const updateItems = {
      items: sortedItems
    }
    updateInfo = await groceryListList.findOneAndUpdate(
      { _id: new ObjectId(listId) },
      { $set: updateItems },
      { returnDocument: 'after' }
    );
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `Error could not find user`;

    if (foundItem === null) {
      await this.createItemAnnouncement(newItem._id.toString(), listId, userId)
    } else {
      await this.createItemAnnouncement(foundItem._id.toString(), listId, userId)
    }
    return updateInfo; // show entire list not just new item
  },

  async getAllItems(groceryListId) {
    if (!groceryListId) {
      throw `You must provide an list id`;
    }
    if (!ObjectId.isValid(groceryListId)) {
      throw `invalid list ID`;
    }

    let targetList = await groceryListData.getGroceryList(groceryListId);

    let sortedList = [];
    targetList.items.forEach((item) => {
      if (item.priority.toLowerCase() === 'high') {
        sortedList.push(item);
      }
    })
    targetList.items.forEach((item) => {
      if (item.priority.toLowerCase() === 'medium') {
        sortedList.push(item);
      }
    })
    targetList.items.forEach((item) => {
      if (item.priority.toLowerCase() === 'low') {
        sortedList.push(item);
      }
    })
    return sortedList;
  },

  async getItemById(itemId) {
    if (!itemId) throw `You must provide an item id`;
    if (!ObjectId.isValid(itemId)) throw `invalid item Id`;
    const groceryListList = await groceryLists();
    const foundItem = await groceryListList.findOne(
      { 'items._id': new ObjectId(itemId) },
      { projection: { 'items.$': 1 } }
    );
    if (!foundItem) {
      throw `Item not found`;
    }
    return foundItem.items[0];
  },


  async getItem(targetListID, itemName) {// searching for items by name within a list
    if (!targetListID) throw `You must provide an list id`;
    if (!ObjectId.isValid(targetListID)) throw `invalid list Id`;

    itemName = checkString(itemName);
    itemName = itemName.trim();

    const groceryListList = await groceryLists();
    const foundItem = await groceryListList.findOne(
      { '_id': new ObjectId(targetListID), 'items.itemName': itemName },
      { projection: { _id: 1, 'items.$': 1 } }
    );
    if (!foundItem) {
      throw `Item not found`;
    }
    return foundItem.items[0];
  },

  async deleteLItem(listId, itemId, userId) {
    if (!listId) throw `You must provide an list ID`;
    if (!ObjectId.isValid(listId)) throw `invalid list ID`;

    itemId = checkId(itemId, "Item Id");
    userId = checkId(userId, "User Id");

    await this.deleteItemAnnouncement(itemId, listId, userId);

    const listCollection = await groceryLists();
    const list = await listCollection.findOne({ 'items._id': new ObjectId(itemId) });
    const deletionInfo = await listCollection.updateOne(
      { _id: new ObjectId(listId) },
      { $pull: { items: { _id: new ObjectId(itemId) } } }
    );
    if (!deletionInfo) throw `Could not delete item with id of ${itemId}`;

    return { groceryItemDeleted: true };
  },

  async updateItem(itemId, updateObject, userId) {
    if (!itemId) throw `You must provide an item id`;
    if (!ObjectId.isValid(itemId)) throw `Invalid Review ID`;

    userId = checkId(userId, "User Id");

    let itemName, quantity, priority, category;

    if (updateObject.itemName) {
      checkString(updateObject.itemName);
      itemName = updateObject.itemName.trim();
    }
    if (updateObject.quantity) {
      checkAge(updateObject.quantity);
      quantity = updateObject.quantity;
    }
    if (updateObject.priority) {
      checkString(updateObject.priority);
      priority = updateObject.priority.trim();
    }
    if (updateObject.category) {
      checkString(updateObject.category);
      category = updateObject.category.trim();
    }

    itemName = itemName.slice(0, 1).toUpperCase() + itemName.slice(1).toLowerCase();  // store everything the same
    priority = priority.slice(0, 1).toUpperCase() + priority.slice(1).toLowerCase();  // store everything the same
    category = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();  // store everything the same

    const groceryListList = await groceryLists();
    const foundItem = await groceryListList.findOne(
      { 'items._id': new ObjectId(itemId) },
      { projection: { 'items.$': 1 } }
    );
    if (!foundItem) {
      throw `Item not found`;
    }
    let listId = foundItem._id.toString();
    // cannot get rid of item ID when updating or change it

    // console.log(foundItem);
    // console.log(foundItem.items[0].comments);
    const updatedItem = {
      _id: new ObjectId(itemId),
      listId: listId,
      itemName: itemName,
      quantity: quantity,
      priority: priority,
      category: category,
      comments: foundItem.items[0].comments
    }

    let updateInfo = await groceryListList.findOneAndUpdate(
      { 'items._id': new ObjectId(itemId) },
      { $set: { 'items.$': updatedItem } },
      { returnDocument: 'after' }
    );
    if (!updateInfo) throw `Update failed, could not find item with id ${itemId}`;

    // List is Sorted by Priority
    const sortedItems = await this.getAllItems(listId);
    const updateItems = {
      items: sortedItems
    }
    updateInfo = await groceryListList.findOneAndUpdate(
      { _id: new ObjectId(listId) },
      { $set: updateItems },
      { returnDocument: 'after' }
    );

    await this.updateItemAnnouncement(itemId, listId, userId);

    return updateInfo;

  },
  async createItemAnnouncement(itemId, groceryListId, userId) {
    itemId = checkId(itemId, "Item Id");
    userId = checkId(userId, "User Id");
    groceryListId = checkId(groceryListId, "Grocery List Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await groceryListData.getGroceryList(groceryListId);
    if (!groceryList) throw `Grocery list could not be found`;

    const foundItem = await this.getItemById(itemId);
    if (!foundItem) throw `Grocery Item could not be found`;
    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " added '" + foundItem.itemName + "' to '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), comment = "", householdName = userMember.householdName, action = 'createItem';
    currentDate = currentDate.toLocaleString()

    const newAnnouncement = {
      action, // might get rid of this 
      groceryList: groceryList.groceryName,
      groceryItem: foundItem.itemName,
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
  async deleteItemAnnouncement(itemId, groceryListId, userId) {
    itemId = checkId(itemId, "Item Id");
    userId = checkId(userId, "User Id");
    groceryListId = checkId(groceryListId, "Grocery List Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await groceryListData.getGroceryList(groceryListId);
    if (!groceryList) throw `Grocery list could not be found`;

    const foundItem = await this.getItemById(itemId);
    if (!foundItem) throw `Grocery Item could not be found`;
    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " removed '" + foundItem.itemName + "' from '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), comment = "", householdName = userMember.householdName, action = 'deleteItem';
    currentDate = currentDate.toLocaleString()

    const newAnnouncement = {
      action, // might get rid of this 
      groceryList: groceryList.groceryName,
      groceryItem: foundItem.itemName,
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
  async updateQuantity(itemId, incQuantity) {
    if (!itemId) {
      throw `You must provide an item ID`;
    }
    else {
      const checkID = checkId(itemId, 'Item ID');
      if (checkID === undefined) {
        throw `You must provide an item ID`;
      }
    }

    if (!incQuantity) {
      throw `You must provide a quantity`;
    }
    else {
      const checkQuant = checkAge(incQuantity, 'Quantity');
      if (checkQuant === undefined) {
        throw `You must provide a quantity`;
      }
    }

    const groceryListt = await groceryLists();
    const item = groceryListt.items.find(item => item._id === itemId);

    if (!item) {
      throw `Could not find item with id of ${itemId}`;
    }

    const finalQuant = item.quantity + incQuantity;
    if (incQuantity === -1 && item.quantity === 1) {
      this.deleteLItem(itemId);
    }
    if (finalQuant < 0) {
      throw `Quantity cannot be less than 0`;
    }

    const updatedItem = await groceryListt.updateOne(
      { 'items._id': new ObjectId(itemId) },
      { $set: { 'items.$.quantity': finalQuant } },
      { returnDocument: 'after' }
    );

    if (updatedItem.modifiedCount === 0) {
      throw `Could not update quantity for item with id of ${itemId}`;
    }
    else {
      return { updated: true };
    }
  },
  async updateItemAnnouncement(itemId, groceryListId, userId) {
    itemId = checkId(itemId, "Item Id");
    userId = checkId(userId, "User Id");
    groceryListId = checkId(groceryListId, "Grocery List Id");

    // Get name of user who is joining household
    const userMember = await userData.getUserById(userId);
    if (!userMember) throw `User could not be found`;

    const groceryList = await groceryListData.getGroceryList(groceryListId);
    if (!groceryList) throw `Grocery list could not be found`;

    const foundItem = await this.getItemById(itemId);
    if (!foundItem) throw `Grocery Item could not be found`;
    // Make New Announcement
    const announcement = userMember.firstName + " " + userMember.lastName + " edited an item in '" + groceryList.groceryName + "'!";
    let currentDate = new Date(), comment = "", householdName = userMember.householdName, action = 'editItem';
    currentDate = currentDate.toLocaleString()

    const newAnnouncement = {
      action, // might get rid of this 
      groceryList: groceryList.groceryName,
      groceryItem: foundItem.itemName,
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
