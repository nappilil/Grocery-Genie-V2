import { announcements, users } from '../config/mongoCollections.js'; // import collection
import { ObjectId } from 'mongodb';
import { checkId, checkString } from '../validation.js'

const exportedMethods = {
  async newAnnouncement(
    action,
    comment,
    userId,
    householdName,
    groceryList,
    groceryItem
  ) {
    action = checkString(action, 'Action');
    if (comment.length === 0) {
      comment = "";
    } else {
      comment = checkString(comment, 'Comment');
    }
    userId = checkId(userId, 'User ID');
    householdName = checkString(householdName, 'Household Name');
    const announcementCollection = await announcements();
    const currentDate = new Date();
    const date = currentDate.toLocaleString()

    const newAnnouncement = {
      action: action,
      groceryList: groceryList || '',
      groceryItem: groceryItem || '',
      comment: comment,
      userId: new ObjectId(userId),
      householdName: householdName,
      //announcement: announcement,
      currentDate: date
    };
    const insertInfo = await announcementCollection.insertOne(newAnnouncement);

    if (insertInfo.insertedCount === 0) {
      throw `Could not add announcement`;
    }
    else {
      return { inserted: true };
    }
  },

  async deleteOldAnnouncement(id) {
    id = checkId(id, 'ID');
    const announcementCollection = await announcements();
    const deleteAnnouncement = await announcementCollection.deleteOne({ _id: new ObjectId(id) });
    if (deleteAnnouncement.deletedCount === 0) {
      throw `Could not delete announcement with id of ${id}`;
    }
    else {
      return { deleted: true };
    }
  },
  // because if there are different households should only see announcements from your household
  async getAllAnnouncementsByHouseholdName(householdName) {
    householdName = checkString(householdName);
    const announcementCollection = await announcements();
    let announcementList = await announcementCollection
      .find({ householdName: householdName })
      .project({ _id: 0, announcement: 1, comment: 1, currentDate: 1 })   // just return needed fields
      .toArray();
    if (!announcementList) throw `Could not get all Announcements`
    announcementList.reverse(); // most recent announcements on top
    return announcementList; // return list of announcements
  },

  async deleteComment(id) {
    id = checkId(id, 'ID');
    const announcementCollection = await announcements();
    const deleteComment = await announcementCollection.deleteOne({ _id: new ObjectId(id) });
    if (deleteComment.deletedCount === 0) {
      throw `Could not delete comment with id of ${id}`;
    }
    else {
      return { updated: true };
    }
  },
  
  async updateAnnouncement(
    id,
    action,
    groceryItem,
    groceryList,
    comment,
    userId
  ) {
    id = checkId(id, 'ID');
    userId = checkId(userId, 'User ID');
    action = checkString(action, 'Action');
    groceryItem = checkString(groceryItem, 'Grocery Item');
    groceryList = checkString(groceryList, 'Grocery List');
    comment = checkString(comment, 'Comment');
    userId = checkId(userId, 'User ID');
    const announcementCollection = await announcements();
    const updatedAnnouncement = await announcementCollection.updateOne(
      {
        _id: new ObjectId(id)
      },
      {
        $set: { 
          action: action,
          groceryItem: groceryItem,
          groceryList: groceryList,
          comment: comment,
          userId: new ObjectId(userId)
        } 
      }
    );
    if(!updatedAnnouncement.modifiedCount){
      throw `Could not update announcement with id of ${id}`;
    }
    else{
      return {updated: true};
    }
    },
  async getAnnouncementById(id) {
    id = checkId(id, "Announcement Id");
    const announcementCollection = await announcements();
    const announcementPost = await announcementCollection.findOne({ _id: new ObjectId(id) });
    if (!announcementPost) {
      throw 'Error: Announcement not found.'
    }
    return announcementPost;
  },

  async updateAnnouncement(id, comment) {
    id = checkId(id, "Announcement Id");
    comment = checkString(comment, "comment");
    const currentAnnouncement = await this.getAnnouncementById(id);
    if (!currentAnnouncement) throw `Error: Cound not find announcement`;

    const updateAnnouncement = {
      _id: currentAnnouncement._id,
      action: currentAnnouncement.action, // might get rid of this 
      groceryList: currentAnnouncement.groceryList,
      groceryItem: currentAnnouncement.groceryItem,
      comment: comment,
      userId: currentAnnouncement.userId,
      householdName: currentAnnouncement.householdName,
      announcement: currentAnnouncement.announcement,// added this for text to store in database
      currentDate: currentAnnouncement.currentDate
    }

    const announcementCollection = await announcements();
    const announcementPost = await announcementCollection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateAnnouncement }, { returnDocument: 'after' });
    if (!announcementPost) throw 'Error: Could not update announcement'
    
    // Get user and update 
    const userCollection = await users();
    let updatedInfo = await userCollection.findOneAndUpdate(
      { 'announcements._id': new ObjectId(id) },
      { $set: { 'announcements.$': updateAnnouncement } },
      { returnDocument: 'after' }
    );
    // if user cannot be updated method should throw
    if (!updatedInfo) {
      throw 'Error: Could not update user successfully';
    }
    return updateAnnouncement;
  }
};
export default exportedMethods;
