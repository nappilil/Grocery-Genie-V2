import { Router } from 'express';
const router = Router();
import { groceryItemsData, groceryListData, commentsData } from '../data/index.js';
import { checkHouseholdName, checkString, checkId } from '../validation.js';
import xss from 'xss';

router.route('/new')//hasn't been tested
  .get(async (req, res) => {
    const user = req.session.user;
    try {
      res.status(200).render('groceryList/new', {
        pageTitle: 'New Grocery List',
        user,
        authenticated: true,
        household: true,
        hasErrors: true,
        csrfToken: req.csrfToken()
      });
    } catch (e) {
      console.error('Error displaying new grocery list form:', e);
      res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: e, authenticated: true, household: true });
    }
  })
  .post(async (req, res) => {
    const user = req.session.user;
    const newListData = req.body;
    let userId = user.userId;
    let householdName = user.householdName;
    let groceryName = xss(newListData.groceryName);
    let listType = xss(newListData.listType);
    let errors = [];
    try {
      groceryName = checkString(groceryName, "Grocery Name");
    } catch (e) {
      errors.push(e);
    }
    try {
      if (listType.toLowerCase() !== 'community')
        if (listType.toLowerCase() !== 'special occasion')
          if (listType.toLowerCase() !== 'personal') {
            throw 'Not a valid list type';
          }
    } catch (e) {
      errors.push(e);
    }
    // If any errors then display them
    if (errors.length > 0) {
      res.status(400).render('groceryList/new', {
        pageTitle: "New Grocery List",
        errors: errors,
        hasErrors: true,
        groceryList: newListData,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken()
      });
      return;
    }
    try {
      // Call the method to create a new grocery list item
      let newListInfo = await groceryListData.newGroceryList(userId, householdName, groceryName, listType);
      if (!newListInfo) throw `Error could not create new list`;
      return res.redirect(`/items/createItem?listId=${newListInfo._id}`);
    } catch (error) {
      // Handle errors appropriately, for example, render an error page
      res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: error, authenticated: true, household: true });
    }
  });

router.route('/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    let listId = req.params.id;
    let errors = [];
    try {
      listId = checkId(listId, "Grocery List Id");
    } catch (e) {
      errors.push(e);
      res.status(400).render('error', {
        pageTitle: "Error",
        errors: errors,
        hasErrors: true,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      })
      return;
    }
    //console.log(req.session.user); 
    try {
      const groceryList = await groceryListData.getGroceryList(listId);
      res.status(200).render('groceryList/single', {
        pageTitle: 'Grocery List',
        user,
        authenticated: true,
        household: true,
        groceryList,
        listId,
        csrfToken: req.csrfToken(),
      });
    } catch (e) {
      //console.error('Error fetching grocery list:', e);
      res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: e, authenticated: true, household: true });
    }
  })
  .post(async (req, res) => {
    let comment = xss(req.body.comment);
    //console.log(req.body);
    //console.log(req.session);
    let listId = req.params.id;
    let itemId = xss(req.body.itemId);

    //console.log(listId);
    let errors = [];
    let user = req.session.user;
    let userId = user.userId;
    try {
      listId = checkId(listId.toString(), "List Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      itemId = checkId(itemId.toString(), "Item Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      comment = checkString(comment, "Comment");
    } catch (e) {
      errors.push(e)
    }
    try {
      if (comment.trim() === "") {
        return res.status(400).redirect('/groceryLists/' + listId)      
      }
    } catch (e) {
      errors.push(e);
    }
    //console.log("in routes");
    let newComment;
    //console.log(listId);
    if (errors.length > 0) {
      res.status(400).render('groceryList/single', {
        pageTitle: "New Grocery List",
        errors: errors,
        hasErrors: true,
        listId: listId,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    }
    try {
      newComment = await commentsData.newComment(userId, listId, itemId, comment);
      //console.log(newComment);
      if (newComment.acknowledged === false) throw 'Error: unable to add comment';
      return res.status(200).redirect('/groceryLists/' + listId);
    } catch (error) {
      //errors.push(e);
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: error, authenticated: true, household: true });
    }
  })

router.route('/delete')
  .get(async (req, res) => {
    return res.redirect('household/info');
  })

router.route('/edit/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    let listId = req.params.id;
    let groceryList;
    let errors = [];
    try {
      listId = checkId(listId, "Grocery List Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      groceryList = await groceryListData.getGroceryList(listId);
    } catch (e) {
      errors.push(e);
    }
    if (errors.length > 0) {
      res.status(400).render('groceryList/edit', {
        pageTitle: "Edit Grocery List",
        errors: errors,
        hasErrors: true,
        listId: listId,
        groceryList: groceryList,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    }
    try {
      res.status(200).render('groceryList/edit', {
        pageTitle: 'Edit Grocery List',
        user,
        authenticated: true,
        groceryList: groceryList,
        listId: listId,
        household: true,
        csrfToken: req.csrfToken(),
      });
    } catch (e) {
      //console.error('Error displaying edit grocery list form:', e);
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: "Error", errors: e, authenticated: true, household: true });
    }
  })
  .post(async (req, res) => {
    const user = req.session.user;
    let editData = req.body;
    let groceryName, listType;
    let listId = req.params.id;
    let errors = [];
    try {
      listId = checkId(listId, "List Id");
    } catch (e) {
      errors.push(e);
    }
    let oldGroceryList = await groceryListData.getGroceryList(listId);
    if (editData.groceryName) {
      groceryName = xss(editData.groceryName);
      try {
        groceryName = checkString(groceryName, "Grocery List Name");
      } catch (e) {
        errors.push(e);
      }
    } else {
      groceryName = oldGroceryList.groceryName;
    }
    if (editData.listType) {
      listType = xss(editData.listType)
      try {
        if (listType.trim().toLowerCase() !== 'community')
          if (listType.trim().toLowerCase() !== 'special occasion')
            if (listType.trim().toLowerCase() !== 'personal') {
              throw 'Not a valid list type';
            }
      } catch (e) {
        errors.push(e);
      }
    } else {
      listType = oldGroceryList.listType;
    }
    if (errors.length > 0) {
      res.status(400).render('groceryList/edit', {
        pageTitle: "New Grocery List",
        errors: errors,
        hasErrors: true,
        groceryList: newListData,
        listId: listId,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    }
    try {
      // Call the method to create a new grocery list item
      let editListInfo = await groceryListData.updateGroceryList(listId, groceryName, listType, user.userId);
      if (!editListInfo) throw `Error could not edit list`;
      return res.status(200).redirect('/users/profile');
    } catch (error) {
      // Handle errors appropriately, for example, render an error page
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: error, authenitcated: true, household: true });
    }
  })

router.route('/delete/:id')
  .get(async (req, res) => {
    const user = req.session.user;
    let listId = req.params.id;
    let groceryList;
    let errors = [];
    try {
      listId = checkId(listId, "Grocery List Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      groceryList = await groceryListData.getGroceryList(listId);
    } catch (e) {
      errors.push(e);
    }
    // If any errors then display them
    if (errors.length > 0) {
      res.status(400).render('groceryList/delete', {
        pageTitle: "Delete Grocery List",
        errors: errors,
        hasErrors: true,
        listId: listId,
        groceryList: groceryList,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    }
    try {
      res.status(200).render('groceryList/delete', {
        pageTitle: 'Delete Grocery List',
        user,
        authenticated: true,
        groceryList: groceryList,
        listId: listId,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    } catch (e) {
      //console.error('Error displaying edit grocery list form:', e);
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: "Error", errors: e, authenticated: true, household: true });
    }
  })
  .post(async (req, res) => {
    let listId = req.params.id;
    const user = req.session.user;
    let groceryList;
    let errors = [];
    try {
      listId = checkId(listId, "Grocery List Id");
    } catch (e) {
      errors.push(e);
    }
    try {
      groceryList = await groceryListData.getGroceryList(listId);
    } catch (e) {
      errors.push(e);
    }
    // If any errors then display them
    if (errors.length > 0) {
      res.status(400).render('groceryList/new', {
        pageTitle: "New Grocery List",
        errors: errors,
        hasErrors: true,
        groceryList: groceryList,
        listId: listId,
        authenticated: true,
        household: true,
        csrfToken: req.csrfToken(),
      });
      return;
    }
    try {
      let del = await groceryListData.deleteGroceryList(listId, user.householdName, user.userId);
      if (!del) throw `Error: Could not delete grocery list`;
      return res.status(200).redirect('/users/profile');
    } catch (e) {
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: e, authenticated: true, household: true });
    }
  })



export default router;