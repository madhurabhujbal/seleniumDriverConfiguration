const { Builder } = require("selenium-webdriver");

const driver = new Builder().forBrowser("chrome").build();

driver.get("http://google.com");
