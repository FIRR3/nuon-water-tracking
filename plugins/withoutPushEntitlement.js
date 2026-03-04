/**
 * Custom config plugin that removes the aps-environment entitlement.
 * This is required because expo-notifications automatically adds aps-environment
 * during prebuild, but aps-environment (Push Notifications capability) is not
 * supported by free personal Apple Developer accounts.
 * Local/scheduled notifications continue to work without this entitlement.
 */
const { withEntitlementsPlist } = require("expo/config-plugins");

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
