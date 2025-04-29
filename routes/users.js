import { Router } from 'express';
const router = Router();
import { userData, groceryListData, announcementData } from '../data/index.js';
import { checkId, checkName, checkAge, checkEmail, checkPasswordSignUp, checkPasswordLogin, checkString, checkComment } from '../validation.js';
import { users } from '../config/mongoCollections.js'; // import collection
import xss from 'xss';


router.route('/')
  .get(async (req, res) => {
  })

// Render Signup Page
router.route('/signup')
  .get(async (req, res) => {
    res.status(200).render('landing/signup', {
      pageTitle: 'Sign Up',
      authenticated: false,
      household: false,
      csrfToken: req.csrfToken()
    });
  })
  .post(async (req, res) => {
    // request body
    const newUserData = req.body;
    let firstName = xss(newUserData.firstName);
    let lastName = xss(newUserData.lastName);
    let email = xss(newUserData.email);
    let password = xss(newUserData.password);
    let age = parseInt(newUserData.age);
    let errors = [];
    // Error Checking
    try {
      firstName = checkName(firstName, "First Name");
    } catch (e) {
      errors.push(e);
    }
    try {
      lastName = checkName(lastName, "Last Name");
    } catch (e) {
      errors.push(e);
    }
    try {
      email = checkEmail(email, "Email Address");
    } catch (e) {
      errors.push(e);
    }
    try {
      password = checkPasswordSignUp(password, "Password");
    } catch (e) {
      errors.push(e);
    }
    try {
      age = checkAge(age, "Age");
    } catch (e) {
      errors.push(e);
    }
    try {
      // Check Email is not Already in Use
      const userCollection = await users();
      const existingUser = await userCollection.find({ email: email }).toArray();
      if (existingUser.length !== 0) throw `Error: Email is already in use`;
    } catch (e) {
      errors.push(e);
    }
    // If any errors return fields already supplied with errors
    if (errors.length > 0) {
      res.status(400).render('landing/signup', {
        errors: errors,
        hasErrors: true,
        user: newUserData,
        authenticated: false,
        household: false,
        csrfToken: req.csrfToken()
      });
      return;
    }
    try {
      const user = await userData.addUser(email, password, firstName, lastName, age);
      // Create Account Successfull set req.session.user
      req.session.user = { firstName: user.firstName, lastName: user.lastName, userId: user._id, householdName: user.householdName, email: user.email, age: user.age }
      const authenticated = req.session.user;
      if (authenticated && authenticated.householdName.length === 0) {
        return res.redirect('/household/new');
      }
      else if (authenticated && authenticated.householdName.length !== 0) {
        return res.redirect('/household/info');
      }
    } catch (e) {
      let errors = [];
      errors.push(e);
      res.status(400).render("login", {
        pageTitle: "Log In",
        errors: errors,
        hasErrors: true,
        user: newUserData,
        authenticated: false,
        household: false,
        csrfToken: req.csrfToken()
      });
      return;
    }
  })

router.route('/login')
  .get(async (req, res) => {
    res.status(200).render('landing/login', {
      pageTitle: 'Log In',
      authenticated: false,
      household: false,
      csrfToken: req.csrfToken()
    });
  })
  .post(async (req, res) => {
    // Get Request Body
    const userLogInData = req.body;
    let email = xss(userLogInData.email);
    let password = xss(userLogInData.password);
    let errors = [];

    // Error Checking
    try {
      email = checkEmail(email, "Email Address");
    } catch (e) {
      errors.push(e);
    }
    try {
      password = checkPasswordLogin(password, "Password");
    } catch (e) {
      errors.push(e);
    }
    // If any errors then display them
    if (errors.length > 0) {
      res.status(400).render('landing/login', {
        pageTitle: "Log In",
        errors: errors,
        hasErrors: true,
        user: userLogInData,
        authenticated: false,
        household: false,
        csrfToken: req.csrfToken()
      });
      return;
    }
    try {
      // Login Successfull set req.session.user
      const user = await userData.logInUser(email, password);
      req.session.user = { firstName: user.firstName, lastName: user.lastName, userId: user._id, householdName: user.householdName, email: user.email, age: user.age }
      const authenticated = req.session.user;
      if (authenticated && authenticated.householdName.length === 0) {
        return res.redirect('/household/new');
      }
      else if (authenticated && authenticated.householdName.length !== 0) {
        return res.redirect('/household/info');
      }
    } catch (e) {
      let errors = [];
      errors.push(e);
      res.status(400).render("landing/login", {
        pageTitle: "Log In",
        errors: errors,
        hasErrors: true,
        user: userLogInData,
        authenticated: false,
        household: false,
        csrfToken: req.csrfToken()
      });
      return;
    }
  });

router.route('/profile')
  .get(async (req, res) => {
    const user = req.session.user;
    let household = false;
    if (user.householdName.length !== 0) {
      household = true;
    }
    try {
      user.userId = checkId(user.userId, "User Id"); // extra error checking
    } catch (e) {
      res.status(503).render("error", {
        pageTitle: "Error",
        errors: e,
        hasErrors: true,
        authenticated: true,
        household: household,
        csrfToken: req.csrfToken()
      });
      return;
    }
    const userProfile = await userData.getUserById(user.userId); // get user by Id
    let groceryList = [];
    let errors = [];
    for (let listId in userProfile.groceryLists) {
      try {
        let groceryName = await groceryListData.getGroceryList(userProfile.groceryLists[listId]);
        groceryList.push(groceryName);
      } catch (e) {
        errors.push(e);
        res.status(503).render("error", {
          pageTitle: "Error",
          errors: e,
          hasErrors: true,
          authenticated: true,
          household: household,
          csrfToken: req.csrfToken()
        });
        return;
      }
    }
    //console.log(userProfile.announcements);
    res.status(200).render('users/profile', {
      pageTitle: 'My Profile',
      authenticated: true,
      user: userProfile, // render userprofile
      groceryList: groceryList,
      household: household,
      csrfToken: req.csrfToken()
    });
  })
  .post(async (req, res) => {
    const user = req.session.user;
    let announcementComment = req.body;
    if (announcementComment.comment.trim() === "") {
      return res.redirect('profile');
    }
    let comment = xss(announcementComment.comment);
    let announcementId = xss(announcementComment.announcementId);
    let household = false;
    if (user.householdName.length !== 0) {
      household = true;
    }
    let errors = [];
    try {
      comment = checkComment(comment, "Comment");
    } catch (e) {
      errors.push(e);
      res.status(400).render("error", {
        pageTitle: "Error",
        errors: e,
        hasErrors: true,
        authenticated: true,
        household: household,
        csrfToken: req.csrfToken()
      });
      return;
    }
    try {
      // Call the method to create a new grocery list item
      let editAnnouncement = await announcementData.updateAnnouncement(announcementId, comment);
      if (!editAnnouncement) throw `Error could not edit list`;
      return res.status(200).redirect('/users/profile');
    } catch (error) {
      // Handle errors appropriately, for example, render an error page
      return res.status(500).render('error', { csrfToken: req.csrfToken(), pageTitle: 'Error', errors: error, authenitcated: true, household: household });
    }
  });

router.route('/logout').get(async (req, res) => {
  const user = req.session.user;
  if (user) {
    let household = false;
    if (user.householdName.length !== 0) {
      household === true;
    }
    res.status(200).render('users/logout', {
      pageTitle: 'Logout',
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      themePreference: req.session.user.themePreference,
      authenticated: false,
      household: household
    });
    req.session.destroy();
  }
});






export default router;