import { Router } from 'express';
const router = Router();
import { groceryItemsData } from '../data/index.js';
import { checkString, checkAge, checkId, checkComment } from '../validation.js';
import xss from 'xss';

router.route('/createItem')
  .get(async (req, res) => {
    const user = req.session.user;
    const listId = req.query.listId;

    const successMessage = req.session.successMessage;
    // Clear the success message from the session
    delete req.session.successMessage;

    res.status(200).render('items/new', {
      pageTitle: 'New Item',
      user,
      authenticated: true,
      household: true,
      listId: listId,
      successMessage: successMessage
    });
  })
  .post(async (req, res) => {
    const user = req.session.user;
    const newItemData = req.body;
    let userId = user.userId;
    let listId = xss(newItemData.listId);
    let itemName = xss(newItemData.itemName);
    let quantity = parseInt(newItemData.quantity)
    let priority = xss(newItemData.priority);
    let category = xss(newItemData.category);
    let comments = xss(newItemData.comments);
    let errors = [];
    try {
      listId = checkId(listId, "List Id")
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }
    try {
      itemName = checkString(itemName, "Item Name")
    } catch (e) {
      errors.push(e);
    }
    try {
      quantity = checkAge(quantity, 'Quantity'); //Just a check is whole number function
    } catch (e) {
      errors.push(e);
    }
    try {
      priority = checkString(priority, "Priority");
      if (priority.toLowerCase() !== "low")
        if (priority.toLowerCase() !== 'medium')
          if (priority.toLowerCase() !== 'high')
            throw `Error: invalid priority ranking`;
    } catch (e) {
      errors.push(e);
    }
    try {
      category = checkString(category, 'Category');
    } catch (e) {
      errors.push(e);
    }
    if (comments) {
      try {
        comments = checkString(comments, 'Comment');
      } catch (e) {
        errors.push(e);
      }
    }
    // If any errors then display them
    if (errors.length > 0) {
      res.status(400).render('items/new', {
        pageTitle: "New Item",
        errors: errors,
        hasErrors: true,
        groceryItem: newItemData,
        listId: listId,
        userId: userId,
        authenticated: true,
        household: true
      });
      return;
    }
    itemName = itemName.slice(0, 1).toUpperCase() + itemName.slice(1).toLowerCase();  // store everything the same
    priority = priority.slice(0, 1).toUpperCase() + priority.slice(1).toLowerCase();  // store everything the same
    category = checkString(category);
    category = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();  // store everything the same
    try {
      // Call the method to create a new grocery list item
      let newItemInfo = await groceryItemsData.newItem(userId, listId, itemName, quantity, priority, category, comments);
      if (!newItemInfo) throw `Error: could not add new item`;
      return res.redirect(`/items/createItem?listId=${listId}`);
    } catch (error) {
      // Handle errors appropriately, for example, render an error page
      res.status(500).render('error', { pageTitle: 'Error', errors: error, authenticated: true, household: true });
    }
  });

  router.route('/increaseQ/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    const listId = req.query.listId;
    const itemId = req.params.id;

    const successMessage = req.session.successMessage;
    delete req.session.successMessage;
    try {
      itemId = checkId(itemId, "Item Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      listId = checkId(listId, "List Id")
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }
    try {
      // Retrieve the item data
      const item = await groceryItemsData.getItemById(itemId);

      // Increment the quantity
      item.quantity += 1;

      // Update the item in the database
      await groceryItemsData.updateItem(itemId, item, user.userId);

      // Redirect back to the grocery list page
      return res.redirect(`/groceryLists/${listId}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to increase quantity.' });
    }
  });

router.route('/editItem/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    const listId = req.query.listId;
    const itemId = req.params.id;
    //console.log('list Id:', listId);
    //console.log('item id', itemId);
    const successMessage = req.session.successMessage;
    delete req.session.successMessage;
    try {
      itemId = checkId(itemId, "Item Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      listId = checkId(listId, "ListId"); // extra error checking
    } catch (e) {
      console.log(e)
    }
    let oldData;
    try {
      oldData = await groceryItemsData.getItemById(itemId);
    } catch (e) {
      console.log(e);
    }
    //console.log(oldData);

    res.status(200).render('items/edit', {
      pageTitle: 'Edit Item',
      user,
      authenticated: true,
      household: true,
      listId: listId,
      itemId: itemId,
      oldData: oldData,
      successMessage: successMessage
    });
  })
  .post(async (req, res) => {
    // get List Id
    const listId = req.query.listId;
    const itemId = req.params.id;
    const newInput = req.body;
    //console.log(newInput);
    const user = req.session.user;
    let nlistId = xss(newInput.listId);
    let itemName = xss(newInput.itemName);
    let quantity = parseInt(newInput.quantity)
    let priority = xss(newInput.priority);
    let category = xss(newInput.category);
    let comments = xss(newInput.comments);
    let errors = [];
    try {
      nlistId = checkId(nlistId, "List Id")
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }
    try {
      itemId = checkId(itemId, "Item Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      itemName = checkString(itemName, "Item Name")
    } catch (e) {
      errors.push(e);
    }
    try {
      quantity = checkAge(quantity, 'Quantity'); //Just a check is whole number function
    } catch (e) {
      errors.push(e);
    }
    try {
      priority = checkString(priority, "Priority");
      if (priority.toLowerCase() !== "low")
        if (priority.toLowerCase() !== 'medium')
          if (priority.toLowerCase() !== 'high')
            throw `Error: invalid priority ranking`;
    } catch (e) {
      errors.push(e);
    }
    try {
      category = checkString(category, 'Category');
    } catch (e) {
      errors.push(e);
    }
    if (comments) {
      try {
        comments = checkComment(comments, 'Comment');
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) {
      res.status(400).render('items/edit', {
        pageTitle: "Edit Item",
        errors: errors,
        hasErrors: true,
        oldData: newInput,
        listId: listId,
        authenticated: true,
        household: true
      });
      return;
    }
    itemName = itemName.slice(0, 1).toUpperCase() + itemName.slice(1).toLowerCase();  // store everything the same
    priority = priority.slice(0, 1).toUpperCase() + priority.slice(1).toLowerCase();  // store everything the same
    category = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();  // store everything the same
    newInput.quantity = Number(newInput.quantity);
    newInput.comments = [newInput.comments];
    // now update
    try {
      let result = await groceryItemsData.updateItem(itemId, newInput, user.userId);
      if (!result) throw `Error: could not update item`;
      return res.redirect(`/groceryLists/${listId}`);
    } catch (e) {
      res.status(500).render('error', { pageTitle: 'Error', errors: e, authenticated: true, household: true });
    }
  });

router.route('/deleteItem/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    const listId = req.query.listId;
    let itemId = req.params.id;
    //console.log(listId);
    const successMessage = req.session.successMessage;
    delete req.session.successMessage;
    try {
      listId = checkId(listId, "List Id")
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }
    try {
      itemId = checkId(itemId, "Item Id");
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }

    res.status(200).render('items/delete', {
      pageTitle: 'Delete Item',
      user,
      authenticated: true,
      household: true,
      listId: listId,
      itemId: itemId,
      //oldData: oldData,
      successMessage: successMessage
    });

  })
  .post(async (req, res) => {
    const user = req.session.user;
    const listId = req.query.listId;
    //console.log(listId);
    let itemId = req.params.id;
    //console.log(itemId);
    let deleteItem;
    let errors = [];
    try {
      listId = checkId(listId, "List Id")
    } catch (e) {
      return res.status(200).redirect('/household/info');
    }
    try {
      itemId = checkId(itemId, "Item Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      deleteItem = await groceryItemsData.deleteLItem(listId, itemId, user.userId);
      if (deleteItem.groceryItemDeleted === false) throw 'Error: Could not delete item.'
      return res.redirect(`/groceryLists/${listId}`);
    } catch (e) {
      console.log(e);
    }
  });

export default router;