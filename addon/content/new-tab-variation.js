// Modified from https://github.com/rhelmer/tracking-protection-study/

/* global addMessageListener sendAsyncMessage*/

"use strict";

const ABOUT_HOME_URL = "about:home";
const ABOUT_NEWTAB_URL = "about:newtab";

class TrackingProtectionStudy {
  constructor(contentWindow) {
    this.init(contentWindow);
  }

  async init(contentWindow) {
    addMessageListener("TrackingStudy:Totals", (msg) => {
      this.handleMessageFromChrome(msg, contentWindow);
    });
  }

  handleMessageFromChrome(msg, contentWindow) {
    const doc = contentWindow.document;
    switch (msg.data.type) {
      case "newTabContent":
        // check if document has already loaded
        if (doc.readyState === "complete") {
          this.addContentToNewTab(msg.data.state, doc);
        } else {
          doc.addEventListener("DOMContentLoaded", () => this.addMessageToNewTab(msg.data.state, doc));
        }
        break;
      default:
        throw new Error(`Message type not recognized, ${ msg.data.type }`);
    }
  }

  addContentToNewTab(state, doc) {
    // TODO bdanforth: Ideally: Update numbers dynamically on page even without refresh?
    const minutes = state.timeSaved / 1000 / 60;
    // FIXME commented out for testing
    // if (minutes >= 1 && this.blockedRequests) {
    // if we haven't blocked anything yet, don't modify the page
    if (state.totalBlockedResources) {
      let message = state.newTabMessage;
      message = message.replace("${blockedRequests}", state.totalBlockedResources);
      message = message.replace("${blockedEntities}", state.totalBlockedEntities.size);
      message = message.replace("${blockedSites}", state.totalBlockedSites);
      message = message.replace("${minutes}", minutes.toPrecision(3));

      // Check if the study UI has already been added to this page
      const tpContent = doc.getElementById("tracking-protection-message");
      if (tpContent) {
        // if already on the page, just update the message
        const spanEle = tpContent.getElementsByTagName("span")[0];
        spanEle.innerHTML = message;
        return;
      }

      const logo = doc.createElement("img");
      logo.src = "chrome://browser/skin/controlcenter/tracking-protection.svg#enabled";
      logo.style.height = 48;
      logo.style.width = 48;

      const span = doc.createElement("span");
      span.style.fontSize = "24px";
      span.style.fontWeight = "lighter";
      span.style.marginLeft = "20px";
      span.innerHTML = message;

      const newContainer = doc.createElement("div");
      newContainer.id = "tracking-protection-message";
      newContainer.style.display = "flex";
      newContainer.style.alignItems = "center";
      newContainer.style.justifyContent = "flex-start";
      newContainer.style.marginBottom = "40px";
      newContainer.append(logo);
      newContainer.append(span);

      // There's only one <main> element on the new tab page
      const mainEle = doc.getElementsByTagName("main")[0];
      mainEle.prepend(newContainer);
    }
  }
}

addEventListener("load", function onLoad(evt) {
  const window = evt.target.defaultView;
  const location = window.location.href;
  if (location === ABOUT_NEWTAB_URL || location === ABOUT_HOME_URL) {
    // queues a function to be called during a browser's idle periods
    window.requestIdleCallback(() => {
      new TrackingProtectionStudy(window);
      sendAsyncMessage("TrackingStudy:OnContentMessage", {action: "get-totals"});
    });
  }
}, true);