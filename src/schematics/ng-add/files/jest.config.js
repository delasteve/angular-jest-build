module.exports = {
  "preset": "../../node_modules/jest-preset-angular/jest-preset.json",
  "globals": {
    "ts-jest": {
      "tsConfigFile": "./tsconfig.spec.json"
    },
    "__TRANSFORM_HTML__": true
  },
  "transform": {
    "^.+\\.(ts|js|html)$": "../../node_modules/jest-preset-angular/preprocessor.js"
  },
  "snapshotSerializers": [
    "../../node_modules/jest-preset-angular/AngularSnapshotSerializer.js",
    "../../node_modules/jest-preset-angular/HTMLCommentSerializer.js"
  ],
  "setupTestFrameworkScriptFile": "./setupJest.ts"
};
