const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const driver = new Builder().forBrowser("chrome").build();

driver.get("http://google.com");
