"use strict";

if (!browser.devtools)
{
  browser.runtime.onMessage.addListener((message, sender, sendResponse) =>
  {
    return ext.onMessage._dispatch(message, {}, sendResponse).includes(true);
  });
}

{
  let port = null;

  ext.onExtensionUnloaded = {
    addListener(listener)
    {
      if (!port)
        port = browser.runtime.connect();

      port.onDisconnect.addListener(listener);
    },
    removeListener(listener)
    {
      if (port)
      {
        port.onDisconnect.removeListener(listener);

        if (!port.onDisconnect.hasListeners())
        {
          port.disconnect();
          port = null;
        }
      }
    }
  };
}
