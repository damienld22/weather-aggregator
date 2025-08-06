module.exports = {
  apps: [
    {
      name: "weather-aggregator",
      script: "./src/index.ts",
      interpreter: "./node_modules/.bin/ts-node",
      watch: false,
    },
  ],
};
