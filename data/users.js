import { household, users } from '../config/mongoCollections.js'; // import collection
import { checkEmail, checkPasswordSignUp, checkName, checkAge, checkId, checkPasswordLogin, checkString } from '../validation.js'
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const exportedMethods = {
  async getUserById(id) {
    id = checkId(id, 'ID');
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) throw `Error: User not found`;
    return user;
  },

  async addUser(
    email,
    password,
    firstName,
    lastName,
    age
  ) {
    // Error Checking
    email = checkEmail(email, 'Email Address');
    password = checkPasswordSignUp(password, 'Password');
    firstName = checkName(firstName, 'First Name');
    lastName = checkName(lastName, 'Last Name');
    age = checkAge(age, 'Age');

    // Check that Email is Not Already In Use
    const userCollection = await users();
    const existingEmail = await userCollection.find({ email: email }).toArray();
    if (existingEmail.length !== 0) throw `Error: Email is already in use`;

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create new user w all info
    let householdName = "";
    let groceryLists = [];
    let announcements = [];
    let comments = [];
    //let shopper = false;
    const newUser = {
      email,
      hashedPassword,
      firstName,
      lastName,
      age,
      householdName,
      groceryLists,
      announcements,
      comments
      //shopper
    };

    // Add New User
    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
      throw 'Error: Could not add user';
    newUser._id = newUser._id.toString(); // convert to string
    return newUser;
  },
  async logInUser(email, password) {
    // Make sure it is a valid email
    email = checkEmail(email, "Email Address");
    password = checkPasswordLogin(password, "Password");
    // Check email is in use
    const userCollection = await users();
    const user = await userCollection.find({ email: email }).toArray();
    if (user.length === 0) throw `Error: No email exists with that login`;

    // check that passwords match
    let compare = await bcrypt.compare(password, user[0].hashedPassword);
    if (!compare) throw `Error: Either Incorrect Email Or Password`;

    return user[0];
  },

  async getAllUsers() {
    const userCollection = await users();
    let userList = await userCollection
      .find({})
      .project({ _id: 0, firstName: 1, lastName: 1 })   // just return the name of the users
      .toArray();
    if (!userList) {
      throw `Could not get all users`
    }
    // Create list of just first and last names
    let members = [];
    userList.forEach((object) => {
      members.push(object.firstName + " " + object.lastName);
    });
    // Returns list of members: [firstName lastName, firstName lastName]
    return members;
  }

  // not needed. can add if time permits
  // async updateUser(
  //   email,
  //   password,
  //   firstName,
  //   lastName,
  //   age
  // ) {
  //   // Error Checking
  //   email = checkEmail(email, 'Email Address');
  //   password = checkPasswordSignUp(password, 'Password');
  //   firstName = checkName(firstName, 'First Name');
  //   lastName = checkName(lastName, 'Last Name');
  //   age = checkAge(age, 'Age');
  //   return;
  // }


};
export default exportedMethods;