const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const options = new chrome.Options();

const driver = new Builder().forBrowser("chrome").build();

driver.get("http://google.com");
