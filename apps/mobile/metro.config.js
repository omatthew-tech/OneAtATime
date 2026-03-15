const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs", "mjs"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force @supabase/auth-js to use its ESM build which Metro handles correctly
  if (moduleName === "@supabase/auth-js") {
    return {
      filePath: path.resolve(
        __dirname,
        "node_modules/@supabase/auth-js/dist/module/index.js"
      ),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
