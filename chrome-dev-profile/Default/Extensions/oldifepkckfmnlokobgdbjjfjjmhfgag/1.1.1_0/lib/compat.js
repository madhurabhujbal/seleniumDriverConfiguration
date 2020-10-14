"use strict";

let onShutdown = {
  done: false,
  add() {},
  remove() {}
};

function nsIHttpChannel() {}

let ComponentsObject = {
  interfaces:
  {
    nsIHttpChannel,
    nsITimer: {TYPE_REPEATING_SLACK: 0},
    nsIInterfaceRequestor: null
  },
  classes:
  {
    "@mozilla.org/timer;1":
    {
      createInstance() { return new FakeTimer(); }
    }
  },
  utils: {
    import(resource)
    {
      let match = /^resource:\/\/gre\/modules\/(.+)\.jsm$/.exec(resource);
      let resourceName = match && match[1];
      if (resourceName && Cu.import.resources.has(resourceName))
        return {[resourceName]: Cu.import.resources.get(resourceName)};

      throw new Error(
        "Attempt to import unknown JavaScript module " + resource
      );
    },
    reportError(e)
    {
      console.error(e);
      console.trace();
    }
  },
  manager: null,
  ID() { return null; }
};
const Cc = ComponentsObject.classes;
const Ci = ComponentsObject.interfaces;
const Cu = ComponentsObject.utils;

Cu.import.resources = new Map([
  [
    "XPCOMUtils",
    {
      generateQI() {}
    }
  ],
  [
    "Services",
    {
      obs: {
        addObserver() {},
        removeObserver() {}
      }
    }
  ]
]);

function FakeTimer()
{
}
FakeTimer.prototype =
{
  delay: 0,
  callback: null,
  initWithCallback(callback, delay)
  {
    this.callback = callback;
    this.delay = delay;
    this.scheduleTimeout();
  },
  scheduleTimeout()
  {
    window.setTimeout(() =>
    {
      try
      {
        this.callback();
      }
      catch (e)
      {
        Cu.reportError(e);
      }
      this.scheduleTimeout();
    }, this.delay);
  }
};

XMLHttpRequest.prototype.channel = {
  status: -1,
  loadFlags: 0,
  INHIBIT_CACHING: 0,
  VALIDATE_ALWAYS: 0
};
