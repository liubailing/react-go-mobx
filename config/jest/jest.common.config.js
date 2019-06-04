module.exports = {
    collectCoverage:true,
    resolver: "jest-pnp-resolver",
    testURL: "http://localhost",
    transform: {
      "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/babel-jest",
      "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
      "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js"
    },
    transformIgnorePatterns: [
      "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$",
      "^.+\\.module\\.(css|sass|scss|less)$"
    ],
    moduleNameMapper: {
      "^.+\\.module\\.(css|sass|scss|less)$": "identity-obj-proxy"
    },
    moduleFileExtensions: [
      "web.js",
      "js",
      "web.ts",
      "ts",
      "web.tsx",
      "tsx",
      "json",
      "web.jsx",
      "jsx",
      "node"
    ],
 
  }