 (function(modules) {

 	var installedModules = {};

 	function __webpack_require__(moduleId) {

 		if(installedModules[moduleId]) {
 			return installedModules[moduleId].exports;
 		}
 		var module = installedModules[moduleId] = {
 			i: moduleId,
 			l: false,
 			exports: {}
 		};

 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

 		module.l = true;

 		return module.exports;
 	}


 	__webpack_require__.m = modules;

 	__webpack_require__.c = installedModules;

 	__webpack_require__.d = function(exports, name, getter) {
 		if(!__webpack_require__.o(exports, name)) {
 			Object.defineProperty(exports, name, {
 				configurable: false,
 				enumerable: true,
 				get: getter
 			});
 		}
 	};

 	__webpack_require__.n = function(module) {
 		var getter = module && module.__esModule ?
 			function getDefault() { return module['default']; } :
 			function getModuleExports() { return module; };
 		__webpack_require__.d(getter, 'a', getter);
 		return getter;
 	};

 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

 	__webpack_require__.p = "";

 	return __webpack_require__(__webpack_require__.s = 0);
 })
 ([
 (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(2);


}),

(function(module, exports, __webpack_require__) {

"use strict";


if (document instanceof HTMLDocument)
{
  document.addEventListener("click", event =>
  {
    if (event.button == 2)
      return;

    if (event.isTrusted == false)
      return;

    let link = event.target;
    while (!(link instanceof HTMLAnchorElement))
    {
      link = link.parentNode;

      if (!link)
        return;
    }

    let queryString = null;
    if (link.protocol == "http:" || link.protocol == "https:")
    {
      if (link.host == "subscribe.adblockplus.org" && link.pathname == "/")
        queryString = link.search.substr(1);
    }
    else
    {
      let match = /^abp:\/*subscribe\/*\?(.*)/i.exec(link.href);
      if (match)
        queryString = match[1];
    }

    if (!queryString)
      return;

    event.preventDefault();
    event.stopPropagation();

    let title = null;
    let url = null;
    for (let param of queryString.split("&"))
    {
      let parts = param.split("=", 2);
      if (parts.length != 2 || !/\S/.test(parts[1]))
        continue;
      switch (parts[0])
      {
        case "title":
          title = decodeURIComponent(parts[1]);
          break;
        case "location":
          url = decodeURIComponent(parts[1]);
          break;
      }
    }
    if (!url)
      return;

    if (!title)
      title = url;

    title = title.trim();
    url = url.trim();
    if (!/^(https?|ftp):/.test(url))
      return;

    browser.runtime.sendMessage({
      type: "subscriptions.add",
      title,
      url,
      confirm: true
    });
  }, true);
}


 }),
 (function(module, exports, __webpack_require__) {

"use strict";

const {checkCollapse, elemhide, getURLsFromElement, typeMap} = window;

let blockelementPopupId = null;

let currentlyPickingElement = false;
let lastMouseOverEvent = null;

let currentElement = null;

let highlightedElementsSelector = null;
let highlightedElementsInterval = null;

let lastRightClickEvent = null;
let lastRightClickEventIsMostRecent = false;


/* Utilities */

function getFiltersForElement(element, callback)
{
  let src = element.getAttribute("src");
  browser.runtime.sendMessage({
    type: "composer.getFilters",
    tagName: element.localName,
    id: element.id,
    src: src && src.length <= 1000 ? src : null,
    style: element.getAttribute("style"),
    classes: Array.prototype.slice.call(element.classList),
    urls: getURLsFromElement(element),
    mediatype: typeMap.get(element.localName),
    baseURL: document.location.href
  },
  response =>
  {
    callback(response.filters, response.selectors);
  });
}

function getBlockableElementOrAncestor(element, callback)
{
  while (element && element != document.documentElement &&
         element != document.body)
  {
    if (!(element instanceof HTMLElement) || element.localName == "area")
      element = element.parentElement;

    else if (element.localName == "map")
    {
      let images = document.querySelectorAll("img[usemap]");
      let image = null;

      for (let currentImage of images)
      {
        let usemap = currentImage.getAttribute("usemap");
        let index = usemap.indexOf("#");

        if (index != -1 && usemap.substr(index + 1) == element.name)
        {
          image = currentImage;
          break;
        }
      }

      element = image;
    }

    else
    {
      getFiltersForElement(element, filters =>
      {
        if (filters.length > 0)
          callback(element);
        else
          getBlockableElementOrAncestor(element.parentElement, callback);
      });

      return;
    }
  }

  callback(null);
}


/* Element highlighting */

function addElementOverlay(element)
{
  let position = "absolute";
  let offsetX = window.scrollX;
  let offsetY = window.scrollY;

  for (let e = element; e; e = e.parentElement)
  {
    let style = getComputedStyle(e);

    if (style.display == "none")
      return null;

    if (style.position == "fixed")
    {
      position = "fixed";
      offsetX = offsetY = 0;
    }
  }

  let overlay = document.createElement("div");
  overlay.prisoner = element;
  overlay.className = "__adblockplus__overlay";
  overlay.setAttribute("style",
                       "opacity:0.4; display:inline-block !important; " +
                       "overflow:hidden; box-sizing:border-box;");
  let rect = element.getBoundingClientRect();
  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
  overlay.style.left = (rect.left + offsetX) + "px";
  overlay.style.top = (rect.top + offsetY) + "px";
  overlay.style.position = position;
  overlay.style.zIndex = 0x7FFFFFFE;

  document.documentElement.appendChild(overlay);
  return overlay;
}

function highlightElement(element, shadowColor, backgroundColor)
{
  unhighlightElement(element);

  let highlightWithOverlay = () =>
  {
    let overlay = addElementOverlay(element);

    if (!overlay)
      return;

    highlightElement(overlay, shadowColor, backgroundColor);
    overlay.style.pointerEvents = "none";

    element._unhighlight = () =>
    {
      overlay.parentNode.removeChild(overlay);
    };
  };

  let highlightWithStyleAttribute = () =>
  {
    let originalBoxShadow = element.style.getPropertyValue("box-shadow");
    let originalBoxShadowPriority =
      element.style.getPropertyPriority("box-shadow");
    let originalBackgroundColor =
      element.style.getPropertyValue("background-color");
    let originalBackgroundColorPriority =
      element.style.getPropertyPriority("background-color");

    element.style.setProperty("box-shadow", "inset 0px 0px 5px " + shadowColor,
                              "important");
    element.style.setProperty("background-color", backgroundColor, "important");

    element._unhighlight = () =>
    {
      element.style.removeProperty("box-shadow");
      element.style.setProperty(
        "box-shadow",
        originalBoxShadow,
        originalBoxShadowPriority
      );

      element.style.removeProperty("background-color");
      element.style.setProperty(
        "background-color",
        originalBackgroundColor,
        originalBackgroundColorPriority
      );
    };
  };

  if ("prisoner" in element)
    highlightWithStyleAttribute();
  else
    highlightWithOverlay();
}

function unhighlightElement(element)
{
  if (element && "_unhighlight" in element)
  {
    element._unhighlight();
    delete element._unhighlight;
  }
}

function highlightElements(selectorString)
{
  unhighlightElements();

  let elements = Array.prototype.slice.call(
    document.querySelectorAll(selectorString)
  );
  highlightedElementsSelector = selectorString;

  highlightedElementsInterval = setInterval(() =>
  {
    if (elements.length > 0)
    {
      let element = elements.shift();
      if (element != currentElement)
        highlightElement(element, "#fd6738", "#f6e1e5");
    }
    else
    {
      clearInterval(highlightedElementsInterval);
      highlightedElementsInterval = null;
    }
  }, 0);
}

function unhighlightElements()
{
  if (highlightedElementsInterval)
  {
    clearInterval(highlightedElementsInterval);
    highlightedElementsInterval = null;
  }

  if (highlightedElementsSelector)
  {
    Array.prototype.forEach.call(
      document.querySelectorAll(highlightedElementsSelector),
      unhighlightElement
    );

    highlightedElementsSelector = null;
  }
}


/* Input event handlers */

function stopEventPropagation(event)
{
  event.stopPropagation();
}

function mouseOver(event)
{
  lastMouseOverEvent = event;

  getBlockableElementOrAncestor(event.target, element =>
  {
    if (event == lastMouseOverEvent)
    {
      lastMouseOverEvent = null;

      if (currentlyPickingElement)
      {
        if (currentElement)
          unhighlightElement(currentElement);

        if (element)
          highlightElement(element, "#d6d84b", "#f8fa47");

        currentElement = element;
      }
    }
  });

  event.stopPropagation();
}

function mouseOut(event)
{
  if (!currentlyPickingElement || currentElement != event.target)
    return;

  unhighlightElement(currentElement);
  event.stopPropagation();
}

function keyDown(event)
{
  if (!event.ctrlKey && !event.altKey && !event.shiftKey)
  {
    if (event.keyCode == 13) // Return
      elementPicked(event);
    else if (event.keyCode == 27) // Escape
      deactivateBlockElement();
  }
}


/* Element selection */

function startPickingElement()
{
  currentlyPickingElement = true;

  Array.prototype.forEach.call(
    document.querySelectorAll("object,embed,iframe,frame"),
    element =>
    {
      getFiltersForElement(element, filters =>
      {
        if (filters.length > 0)
          addElementOverlay(element);
      });
    }
  );

  document.addEventListener("mousedown", stopEventPropagation, true);
  document.addEventListener("mouseup", stopEventPropagation, true);
  document.addEventListener("mouseenter", stopEventPropagation, true);
  document.addEventListener("mouseleave", stopEventPropagation, true);
  document.addEventListener("mouseover", mouseOver, true);
  document.addEventListener("mouseout", mouseOut, true);
  document.addEventListener("click", elementPicked, true);
  document.addEventListener("contextmenu", elementPicked, true);
  document.addEventListener("keydown", keyDown, true);

  ext.onExtensionUnloaded.addListener(deactivateBlockElement);
}
function elementPicked(event)
{
  if (!currentElement)
    return;

  let element = currentElement.prisoner || currentElement;
  getFiltersForElement(element, (filters, selectors) =>
  {
    if (currentlyPickingElement)
      stopPickingElement();

    if (selectors.length > 0)
      highlightElements(selectors.join(","));

    highlightElement(currentElement, "#fd1708", "#f6a1b5");
  });

  event.preventDefault();
  event.stopPropagation();
}

function stopPickingElement()
{
  currentlyPickingElement = false;

  document.removeEventListener("mousedown", stopEventPropagation, true);
  document.removeEventListener("mouseup", stopEventPropagation, true);
  document.removeEventListener("mouseenter", stopEventPropagation, true);
  document.removeEventListener("mouseleave", stopEventPropagation, true);
  document.removeEventListener("mouseover", mouseOver, true);
  document.removeEventListener("mouseout", mouseOut, true);
  document.removeEventListener("click", elementPicked, true);
  document.removeEventListener("contextmenu", elementPicked, true);
  document.removeEventListener("keydown", keyDown, true);
}


/* Core logic */

function deactivateBlockElement(popupAlreadyClosed)
{
  if (currentlyPickingElement)
    stopPickingElement();

  if (blockelementPopupId != null && !popupAlreadyClosed)
  {
    browser.runtime.sendMessage({
      type: "composer.forward",
      targetPageId: blockelementPopupId,
      payload:
      {
        type: "composer.dialog.close"
      }
    });
  }

  blockelementPopupId = null;
  lastRightClickEvent = null;

  if (currentElement)
  {
    unhighlightElement(currentElement);
    currentElement = null;
  }
  unhighlightElements();

  let overlays = document.getElementsByClassName("__adblockplus__overlay");
  while (overlays.length > 0)
    overlays[0].parentNode.removeChild(overlays[0]);

  ext.onExtensionUnloaded.removeListener(deactivateBlockElement);
}

function initializeComposer()
{
  if (typeof ext == "undefined")
    return false;

  document.addEventListener("contextmenu", event =>
  {
    lastRightClickEvent = event;
    lastRightClickEventIsMostRecent = true;

    browser.runtime.sendMessage({
      type: "composer.forward",
      payload:
      {
        type: "composer.content.clearPreviousRightClickEvent"
      }
    });
  }, true);

  ext.onMessage.addListener((message, sender, sendResponse) =>
  {
    switch (message.type)
    {
      case "composer.content.getState":
        if (window == window.top)
        {
          sendResponse({
            active: currentlyPickingElement || blockelementPopupId != null
          });
        }
        break;
      case "composer.content.startPickingElement":
        if (window == window.top)
          startPickingElement();
        break;
      case "composer.content.contextMenuClicked":
        let event = lastRightClickEvent;
        deactivateBlockElement();
        if (event)
        {
          getBlockableElementOrAncestor(event.target, element =>
          {
            if (element)
            {
              currentElement = element;
              elementPicked(event);
            }
          });
        }
        break;
      case "composer.content.finished":
        if (currentElement && message.remove)
        {
          checkCollapse(currentElement.prisoner || currentElement);

          elemhide.apply();
        }
        deactivateBlockElement(!!message.popupAlreadyClosed);
        break;
      case "composer.content.clearPreviousRightClickEvent":
        if (!lastRightClickEventIsMostRecent)
          lastRightClickEvent = null;
        lastRightClickEventIsMostRecent = false;
        break;
      case "composer.content.dialogOpened":
        if (window == window.top)
          blockelementPopupId = message.popupId;
        break;
      case "composer.content.dialogClosed":
        if (window == window.top && blockelementPopupId == message.popupId)
        {
          browser.runtime.sendMessage({
            type: "composer.forward",
            payload:
            {
              type: "composer.content.finished",
              popupAlreadyClosed: true
            }
          });
        }
        break;
    }
  });

  if (window == window.top)
    browser.runtime.sendMessage({type: "composer.ready"});

  return true;
}

if (document instanceof HTMLDocument)
{
  if (!initializeComposer())
    setTimeout(initializeComposer, 2000);
}
})
 ]);