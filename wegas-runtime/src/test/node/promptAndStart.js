const prompt = require("prompt");
const cypress = require("cypress");

const DEFAULT_ADMIN_USERNAME = "root";
const DEFAULT_ADMIN_PASSWORD = "1234";

const schema = {
  properties: {
    url: {
      default: process.env.DEFAULT_URL,
    },
    username: {
      default: DEFAULT_ADMIN_USERNAME,
    },
    password: {
      default: DEFAULT_ADMIN_PASSWORD,
    },
    interface: {
      default: "interactive",
      pattern: /(interactive)|(cli)/,
      message: "write interactive or cli",
    },
  },
};

prompt.start();
prompt.get(schema, function (err, result) {
  (result.interface === "interactive" ? cypress.open : cypress.run)({
    env: {
      WEGAS_URL: result.url,
      ADMIN_USERNAME: result.username,
      ADMIN_PASSWORD: result.password,
    },
  });
});
