const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const options = new chrome.Options();

options.addArguments(
  "user-data-dir=C:\\selenium_projects\\driverConfiguration\\chrome-dev-profile"
);

const driver = new Builder()
  .forBrowser("chrome")
  .setChromeOptions(options)
  .build();

driver.get("https://www.google.com");
