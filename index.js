const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const options = new chrome.Options();

options.addArguments(
  "user-data-dir=C:\\selenium_projects\\driverConfiguration\\chrome-dev-profile"
);

// options.setUserPreferences({
//   "download.default_directory":
//     "C:\\selenium_projects\\driverConfiguration\\delme",
// });
// options.setUserPreferences({
//   "browser.helperApps.neverAsk.saveToDisk": "application/x/csv",
// });

const driver = new Builder()
  .forBrowser("chrome")
  .setChromeOptions(options)
  .build();

// driver.get("https://people.sc.fsu.edu/~jburkardt/data/csv/addresses.csv");
driver.get("https://www.google.com");
