let isEmpty = (value) => {
  if (value === null || value === undefined || value === "")
    return true;
  else
    return false;
}

/* Returns true if the object misses any of the specified properties or if any property of the object
   is empty, false otherwise. */
let isObjectEmpty = (object, properties) => {

  for (let property of properties) {
    if (!Object.prototype.hasOwnProperty.call(object, property) || isEmpty(object[property]))
      return true;
  }
  return false;
}

let isEmailValid = (email) => {
  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
  return email.match(emailRegex) ? true : false;
}

/**
 * Minimum 8 characters which contain only characters,numeric digits, underscore and first character must be a letter.
 * @param {string} password Password
 */
let isPasswordValid = (password) => {
  let passwordRegex = /^[A-Za-z0-9]\w{7,}$/;
  return password.match(passwordRegex) ? true : false;
}

/* Returns true if two Objects/values are same, otherwise false */
let isEqual = (object1, object2) => {

  // if either of them is not an Object
  if (typeof object1 !== "object" || typeof object2 !== "object")
    return object1 === object2;

  // if both are Objects   
  if (Object.keys(object1).length !== Object.keys(object2).length)
    return false;

  for (let property in object1) {
    if (property === '_id') continue;  // exclude certain properties here if reqd.

    if (!object2.hasOwnProperty(property))
      return false;
    if (object1[property] !== object2[property])
      return false;
  }
  return true;
}

/* Remove a specified key from an array */
let spliceWithKey = (arr, key) => {
  for (let i = 0; i < arr.length; i++) {
    if (isEqual(arr[i], key)) {
      arr.splice(i, 1);
      i--;
    }
  }
}

/* Remove a specified key from an array of objects based on a particular property */
let spliceWithKeyAndProperty = (arr, key, property) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][property] === key) {
      arr.splice(i, 1);
      i--;
    }
  }
}

/* Finds a key within an array of objects. Returns the first index if found, '-1' otherwise. */
let findObjectByProperty = (arr, property, key) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][property] === key)
      return i;
  }
  return -1;
}

/* Finds a key within an array of elements. Returns the first index if found, '-1' otherwise. */
let findKey = (arr, key) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === key)
      return i;
  }
  return -1;
}

/* Delete selected properties of an object */
let deleteProperties = (object, properties) => {
  for (let property of properties) {
    if (object.hasOwnProperty(property))
      delete object[property];
  }

  return object;
}

/* Update document with object's selected properties value or with other than selected properties value
 based on 'ignore' if it's true or false. */
let updateDocument = (document, object, selectProps, ignore) => {

  // Ignore the selected properties and assign remaining
  if (ignore) {

    let documentObj = document.toObject();

    for (let prop of selectProps) {
      if (documentObj.hasOwnProperty(prop))
        delete documentObj[prop];
    }

    for (let prop in documentObj) {

      if (object.hasOwnProperty(prop))
        document[prop] = object[prop];
    }

  }

  // Assign the selected properties
  else {
    for (let prop of selectProps) {
      if (documentObj.hasOwnProperty(prop) && object.hasOwnProperty(prop))
        document[prop] = object[prop];
    }
  }

} // END updateObject()

module.exports = {
  isEmpty: isEmpty,
  isObjectEmpty: isObjectEmpty,
  isEmailValid: isEmailValid,
  isPasswordValid: isPasswordValid,
  spliceWithKey: spliceWithKey,
  spliceWithKeyAndProperty: spliceWithKeyAndProperty,
  isEqual: isEqual,
  findObjectByProperty: findObjectByProperty,
  findKey: findKey,
  deleteProperties: deleteProperties,
  updateDocument: updateDocument
}