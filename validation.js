import { ObjectId } from 'mongodb';
import * as EmailValidator from 'email-validator';


const checkId = (id, varName) => {
  if (!id) throw `Error: You must provide a ${varName}`;
  if (typeof id !== 'string') throw `Error:${varName} must be a string`;
  id = id.trim();
  if (id.length === 0)
    throw `Error: ${varName} cannot be an empty string or just spaces`;
  if (!ObjectId.isValid(id)) throw `Error: ${varName} invalid object ID`;
  return id;
}

const checkComment = (strVal, varName) => {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  if (!isNaN(strVal))
    throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
  if (strVal.length > 200)
    throw `Error: ${varName} cannot be greater than 200 chars`;
  return strVal;
}

const checkString = (strVal, varName) => {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  if (!isNaN(strVal))
    throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
  if (strVal.length > 30)
    throw `Error: ${varName} cannot be greater than 30 chars`;
  return strVal;
}

const checkHouseholdName = (strVal, varName) => {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0) throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  if (!isNaN(strVal)) throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
  if (strVal.includes(' ')) throw `Error: ${strVal} cannot contain spaces`;
  strVal = strVal.slice(0, 1).toUpperCase() + strVal.slice(1).toLowerCase(); // store household name as uppercase and lower  
  if (strVal.length > 30)
    throw `Error: ${varName} cannot be greater than 30 chars`;
  return strVal;
}

const checkStringArray = (arr, varName) => {
  //We will allow an empty array for this,
  //if it's not empty, we will make sure all tags are strings
  if (!arr || !Array.isArray(arr))
    throw `You must provide an array of ${varName}`;
  for (let i in arr) {
    if (typeof arr[i] !== 'string' || arr[i].trim().length === 0) {
      throw `One or more elements in ${varName} array is not a string or is an empty string`;
    }
    arr[i] = arr[i].trim();
  }
  return arr;
}

const checkEmail = (email, varName) => {
  if (!email) throw `Error: You must supply a ${varName}!`;
  if (typeof email !== 'string') throw `Error: ${varName} must be a string!`;
  email = email.trim();
  if (email.length === 0)
    throw `Error: ${varName} cannot be empty or just spaces`;
  // https://www.npmjs.com/package/email-validator imported npm that checks if valid email address
  if (!EmailValidator.validate(email))
    throw `Error: ${email} is an invalid ${varName}`;
  if (email.length > 30)
    throw `Error: ${varName} cannot be greater than 30 chars`;
  email = email.toLowerCase(); // case in-sensitive
  return email;
}

const checkPasswordSignUp = (password, varName) => {
  // Check if password is at least 8 chars, and combo of upper & lower case char, at least 1 digit, at least 1 special char.
  if (!password) throw `Error: ${varName} must be at least 8 chars, has one upper and lower case letter, 1 digit, & contains at least one special character`;
  if (typeof password !== 'string') throw `Error: ${varName} must be a string!`;
  password = password.trim();
  if (password.length === 0)
    throw `Error: ${varName} must be at least 8 chars, has one upper and lower case letter, 1 digit, & contains at least one special character`;
  if (password.length < 8)
    throw `Error: ${varName} must be at least 8 chars, has one upper and lower case letter, 1 digit, & contains at least one special character`;
  if (password.length > 50) throw `Error: ${varName} cannot be that long`
  if (!isNaN(password)) // only numbers
    throw `Error: ${varName} must be at least 8 chars, has one upper and lower case letter, 1 digit, & contains at least one special character`;
  // https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
  let regEx = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;
  if (!password.match(regEx))
    throw `Error: ${varName} must be at least 8 chars, has one upper and lower case letter, 1 digit, & contains at least one special character`;
  return password;
}

const checkPasswordLogin = (password, varName) => {
  // Check if password is at least 8 chars, and combo of upper & lower case char, at least 1 digit, at least 1 special char.
  if (!password) throw `Error: must supply a ${varName}`;
  if (typeof password !== 'string') throw `Error: ${varName} must be a string!`;
  password = password.trim();
  if (password.length === 0) throw `Error: must supply a ${varName}`;
  return password;
}

const checkName = (name, varName) => {
  if (!name) throw `Error: You must supply a ${varName}!`;
  if (typeof name !== 'string') throw `Error: ${varName} must be a string!`;
  name = name.trim();
  if (name.length === 0) throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  if (name.length < 2 || name.length > 25) throw `Error: ${varName} must be between 2-25 chars`
  if (!isNaN(name)) throw `Error: ${name} is not a valid value for ${varName} as it only contains digits`;
  let regEx = /^[a-zA-Z]+(?:[- ][a-zA-Z]+)*$/; // allows for letters, spaces, and hyphens
  if (!name.match(regEx)) throw `Error: ${varName} cannot contain numbers or special characters`;
  name = name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase(); // store in database
  return name;
}

const checkAge = (age, varName) => {
  if (!age) throw `Error: You must supply an ${varName}!`;
  if (typeof age !== 'number') {
    throw `${varName || 'provided variable'} is not a number`;
  }
  if (isNaN(age)) {
    throw `${varName || 'provided variable'} is not a number`;
  }
  if (!Number.isInteger(age)) {  // if a decimal
    throw `${varName || 'provided variable'} is a decimal`;
  }
  if (age <= 0 ){
    throw `${varName || 'provided variable'} cannot be negative or 0`;
  }
  if (age > 101 ){
    throw `${varName || 'provided variable'} cannot be greater than 101`;
  }
  return age;
}

const checkCategory = (strVal, varName) => {
  if (!strVal) throw `Error: You must supply a ${varName}!`;
  if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw `Error: ${varName} cannot be an empty string or string with just spaces`;
  let regEx = /^[a-zA-Z]+(?:[ & ][a-zA-Z]+)*$/; // only allows for spaces in between letters or & symbols in
  if (!strVal.match(regEx)) throw `Error: ${varName} cannot contain letters or special characters`;

  // If wanted Dropdown menu of categories and when selecting 'Other' can create own category 
  let categories = ["Alcoholic Beverages", "Baby", "Bakery", "Beverages", "Breakfast Foods", "Canned Goods", "Coffee & Tea", "Condiments & Dressing",
    "Cooking & Baking", "Cookies & Crackers", "Dairy", "Deli", "Frozen Foods", "Health & Personal Care", "Household & Cleaning", "Juices", "Meat",
    "Pasta & Grains", "Pet Supplies", "Produce", "Seafood", "Snacks", "Soda & Soft Drinks", "Spices & Seasonings", "Water", "Other"];
  for (let i = 0; i <= categories.length - 1; i++) {
    if (!strVal.includes(categories[i])) {
      throw `Error: ${varName} must be one of those categories`;
    }
  }
  return strVal;
}

export { checkId, checkString, checkEmail, checkPasswordSignUp, checkPasswordLogin, checkName, checkAge, checkHouseholdName, checkComment };

