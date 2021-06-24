module.exports = async function (appClient, accessToken) {
  return await appClient.authenticate({
    strategy: 'jwt',
    accessToken,
  });
};
