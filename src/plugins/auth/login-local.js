
module.exports = async function (appClient, email, password) {
  return await appClient.authenticate({
    strategy: 'local',
    email,
    password,
  });
};
