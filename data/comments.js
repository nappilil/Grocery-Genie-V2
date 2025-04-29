import {users, comments, groceryLists} from '../config/mongoCollections.js';
import {checkId, checkComment} from '../validation.js';
import userData from './users.js'
import groceryListItemsData from './groceryListItems.js';
import { ObjectId } from 'mongodb';

const exportedMethods = {
    async newComment (
    userId,
    listId,
    itemId,
    text,
  ) {
    // error checking
    checkId(listId, "list ID"); 
    checkId(userId, "User ID"); 
    checkId(itemId, "Item ID");
    if (!text){
      throw 'Error: please enter text'; 
    }
    if (text.trim() == ""){
      throw 'please enter text';
    }
    const user = await userData.getUserById(userId);
    if (!user){
      throw 'Error: User not found'; 
    }
    text = checkComment(text, "Comment");
    text = text.trim(); 
    const commentCollection = await comments(); 
    const date = new Date().toLocaleString()
    const entry = {
      userId,
      text,
      name: user.firstName + " " + user.lastName,
      date
    };
    const insertInfo = await commentCollection.insertOne(entry);
    // if not acknowledged
    if (!insertInfo.acknowledged || !insertInfo.insertedId){
      throw 'Error: Could not add comment';
    }
    entry._id = entry._id.toString();

    // get the corresponding item object
    const groceryListList = await groceryLists();
    const foundItem = await groceryListList.findOne(
      { '_id': new ObjectId(listId)}
    );
    if (!foundItem){
      throw 'Error: Item not found!';
    }
    /*
    const name = foundItem.items[0].itemName
    // then do .itemname
    const item = await groceryListItemsData.getItem(listId, name); 
    */
    const updateObject = {
      _id: entry._id,
      userId: entry.userId, 
      name: entry.name,
      comments: entry.text
    }
    let updateInfo = await groceryListList.updateOne(
      { 'items._id': new ObjectId(itemId)},
      { $push: { 'items.$.comments': updateObject } },
      { returnDocument: 'after' }
    );
    if (!updateInfo){
      throw 'Error: update unsuccessful.'
    }
    //await groceryListItemsData.updateItem(itemId, updateObject);
    
    return insertInfo;
  },
  
  async getComment(id) {
    // search database and return comment
    // if comment not found throw 
    const commentCollection = await comments(); 
    const comment = await commentCollection.findOne({ _id: new ObjectId(id) });
    if (!comment){
      throw 'Error: Comment not found.'
    }
    return comment;
  },

  async deleteComment(listId, itemId, commentId) {
    if (!ObjectId.isValid(listId)) throw `invalid list Id`
    if (!ObjectId.isValid(itemId)) throw `invalid item Id`
    if (!ObjectId.isValid(commentId)) throw `invalid comment Id`
    // serach database and remove comment
    const commentCollection = await comments(); 
    const deleteInfo = await commentCollection.findOneAndDelete({ _id: new ObjectId(commentId) });
    if (!deleteInfo){
      throw 'Error: Deletion unsuccessful'; 
    }
    // must also delete from items
    const groceryListList = await groceryLists();
    const foundItem = await groceryListList.findOne(
      { '_id': new ObjectId(listId)}
    );
    if (!foundItem){
      throw 'Error: Item not found!';
    }
    let deletionInfo = await groceryListList.findOneAndUpdate(
      { 'items._id': new ObjectId(itemId) },
      { $pull: { 'items.$.comments': { _id: new ObjectId(commentId) }} }
      );
    //console.log(deletionInfo);
    if (!deletionInfo) throw `Could not delete item with id of ${commentId}`;
    
    return {commentDeleted: true};
    // remove from groceryLIdt collection
  },
  
  async updateComment(listId, itemId, commentId, text) {
    if (!ObjectId.isValid(listId)) throw `invalid list Id`
    if (!ObjectId.isValid(itemId)) throw `invalid item Id`
    if (!ObjectId.isValid(commentId)) throw `invalid comment Id`
    if (text.trim() === ''){
      throw 'Error: Please enter text.';
    }
    // update in comment collection
    const commentCollection = await comments(); 
    const comment = await commentCollection.findOneAndUpdate({ _id: new ObjectId(commentId) }, {$set: {text: text}}, { returnOriginal: false } );
    if (!comment){
      throw 'Error: Comment not found.'
    }
    // now update grocerylist
    const groceryListList = await groceryLists();
    const foundList = await groceryListList.findOne(
      { '_id': new ObjectId(listId)}
    );
    if (!foundList){
      throw 'Error: Item not found!';
    }
  
   let updateObject = {
    _id: new ObjectId(commentId),
    comments: text
   };
    
    let oldInfo = await groceryListList.findOneAndUpdate(
      { 'items._id': new ObjectId(itemId)},
      { $set: { "items.$.comments.$[comment]": updateObject }  },
      // https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/#update-nested-arrays-in-conjunction-with----
      {arrayFilters: [{"comment._id": commentId}],
      returnDocument: 'after' }
    );

    return oldInfo;
    
  }
  };
  export default exportedMethods;