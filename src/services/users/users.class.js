/* eslint-disable no-unused-vars */
const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');



// We need this to create the MD5 hash
const crypto = require('crypto');

// The Gravatar image service
const gravatarUrl = 'https://s.gravatar.com/avatar';
// The size query. Our chat needs 60px images
const query = 's=60';
// Returns the Gravatar image for an email
const getGravatar = email => {
  // Gravatar uses MD5 hashes from an email address (all lowercase) to get the image
  const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  // Return the full avatar URL
  return `${gravatarUrl}/${hash}?${query}`;
};

// Get user data
const getUserData = (data) => {
  let userData = {};
  // Get avatar
  const avatar = data.avatar || getGravatar(data.email);
  data.avatar = avatar;
  Object.keys(data).forEach(key => {
    if(data[key] !== undefined){
      userData[key] = data[key];
    }
  });
  return userData;
};

// exports.Users = class Users extends feathersNedb.Service {
//   create (data, params) {
//     const userData = getUserData(data);
//     // Call the original `create` method with existing `params` and new data
//     return super.create(userData, params);
//   }
// };

if (getEnvTypeDB() === 'nedb') {
  exports.Users = class Users extends feathersNedb.Service {
    create (data, params) {
      const userData = getUserData(data);
      // Call the original `create` method with existing `params` and new data
      return super.create(userData, params);
    }
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.Users = class Users extends feathersMongoose.Service {
    create (data, params) {
      const userData = getUserData(data);
      // Call the original `create` method with existing `params` and new data
      return super.create(userData, params);
    }
  };
}
