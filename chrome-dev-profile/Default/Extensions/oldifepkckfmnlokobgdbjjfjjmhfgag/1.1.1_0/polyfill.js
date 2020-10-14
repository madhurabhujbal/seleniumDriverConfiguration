"use strict";

{
  const asyncAPIs = [
    "contextMenus.removeAll",
    "devtools.panels.create",
    "notifications.clear",
    "notifications.create",
    "runtime.getBrowserInfo",
    "runtime.openOptionsPage",
    "runtime.sendMessage",
    "runtime.setUninstallURL",
    "storage.local.get",
    "storage.local.remove",
    "storage.local.set",
    "storage.managed.get",
    "tabs.create",
    "tabs.get",
    "tabs.getCurrent",
    "tabs.insertCSS",
    "tabs.query",
    "tabs.reload",
    "tabs.remove",
    "tabs.removeCSS",
    "tabs.sendMessage",
    "tabs.update",
    "webNavigation.getAllFrames",
    "webRequest.handlerBehaviorChanged",
    "windows.create",
    "windows.update"
  ];
  const portClosedBeforeResponseError =
    /^The message port closed before a res?ponse was received\.$/;

  const invalidMessageListenerError = "Invalid listener for runtime.onMessage.";

  let messageListeners = new WeakMap();

  function wrapAsyncAPI(api)
  {
    let object = browser;
    let path = api.split(".");
    let name = path.pop();

    for (let node of path)
    {
      object = object[node];

      if (!object)
        return;
    }

    let func = object[name];
    if (!func)
      return;
    Object.defineProperty(object, name, {
      value(...args)
      {
        let callStack = new Error().stack;

        if (typeof args[args.length - 1] == "function")
          return func.apply(object, args);
        if (typeof args[args.length - 1] == "undefined")
          args.pop();

        let resolvePromise = null;
        let rejectPromise = null;

        func.call(object, ...args, result =>
        {
          let error = browser.runtime.lastError;
          if (error && !portClosedBeforeResponseError.test(error.message))
          {
            if (!(error instanceof Error))
            {
              error = new Error(error.message);

              error.stack = callStack;
            }

            rejectPromise(error);
          }
          else
          {
            resolvePromise(result);
          }
        });

        return new Promise((resolve, reject) =>
        {
          resolvePromise = resolve;
          rejectPromise = reject;
        });
      }
    });
  }

  function wrapRuntimeOnMessage()
  {
    let {onMessage} = browser.runtime;
    let {addListener, removeListener} = onMessage;

    onMessage.addListener = function(listener)
    {
      if (typeof listener != "function")
        throw new Error(invalidMessageListenerError);

      if (messageListeners.has(listener))
        return;

      let wrapper = (message, sender, sendResponse) =>
      {
        let wait = listener(message, sender, sendResponse);

        if (wait instanceof Promise)
        {
          wait.then(sendResponse, reason =>
          {
            try
            {
              sendResponse();
            }
            catch (error)
            {}

            throw reason;
          });
        }

        return !!wait;
      };

      addListener.call(onMessage, wrapper);
      messageListeners.set(listener, wrapper);
    };

    onMessage.removeListener = function(listener)
    {
      if (typeof listener != "function")
        throw new Error(invalidMessageListenerError);

      let wrapper = messageListeners.get(listener);
      if (wrapper)
      {
        removeListener.call(onMessage, wrapper);
        messageListeners.delete(listener);
      }
    };

    onMessage.hasListener = function(listener)
    {
      if (typeof listener != "function")
        throw new Error(invalidMessageListenerError);

      return messageListeners.has(listener);
    };
  }

  function shouldWrapAPIs()
  {
    try
    {
      return !(browser.storage.local.get([]) instanceof Promise);
    }
    catch (error)
    {
    }

    return true;
  }

  if (shouldWrapAPIs())
  {
    if (typeof browser == "undefined")
      window.browser = chrome;

    for (let api of asyncAPIs)
      wrapAsyncAPI(api);

    wrapRuntimeOnMessage();
  }

  for (let object of [HTMLCollection, NodeList, StyleSheetList, CSSRuleList])
  {
    if (!(Symbol.iterator in object.prototype))
      object.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
  }
}
