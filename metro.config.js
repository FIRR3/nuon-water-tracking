const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

config.resolver.alias = {
  "@": __dirname, // points @ to your project root
};
 
module.exports = withNativeWind(config, { input: './app/globals.css' })