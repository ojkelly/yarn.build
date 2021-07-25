/* eslint-disable */

module.exports = function (context, options) {
  return {
    name: "@internal/webpack5-node-api-polyfill",
    configureWebpack(config, isServer) {
      return {
        resolve: {
          fallback: {
            url: require.resolve("url/"),
          },
        },
      };
    },
  };
};
