"use strict";

/* to use:

- Recall this file has chrome privileges
- Cu.import in this file will work for any 'general firefox things' (Services,etc)
  but NOT for addon-specific libs
*/
const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/
var EXPORTED_SYMBOLS = ["config"];

var config = {
  PREF_TP_ENABLED_GLOBALLY: "privacy.trackingprotection.enabled",
  PREF_TP_ENABLED_IN_PRIVATE_WINDOWS: "privacy.trackingprotection.pbmode.enabled",

  // required STUDY key
  "study": {
    /** Required for studyUtils.setup():
      *
      * - studyName
      * - endings:
      *   - map of endingName: configuration
      * - telemetry
      *   - boolean send
      *   - boolean removeTestingFlag
      *
      * All other keys are optional.
      */

    // required keys: studyName, endings, telemetry

    // will be used activeExperiments tagging
    "studyName": "trackingProtectionMessagingExperiment",

    /** **endings**
      * - keys indicate the 'endStudy' even that opens these.
      * - urls should be static (data) or external, because they have to
      *   survive uninstall
      * - If there is no key for an endStudy reason, no url will open.
      * - usually surveys, orientations, explanations
      */
    "endings": {
      /** standard endings */
      "user-disable": {
        "baseUrl": "http://www.example.com/?reason=user-disable",
      },
      "ineligible": {
        "baseUrl": "http://www.example.com/?reason=ineligible",
      },
      "expired": {
        "baseUrl": "http://www.example.com/?reason=expired",
      },
      /** User defined endings */
      "used-often": {
        "baseUrl": "http://www.example.com/?reason=used-often",
        "study_state": "ended-positive",  // neutral is default
      },
      "a-non-url-opening-ending": {
        "study_state": "ended-neutral",
        "baseUrl":  null,
      },
      "introduction-leave-study": {
        "study_state": "ended-negative",
        "baseUrl": "http://www.example.com/?reason=introduction-leave-study",
      },
    },
    "telemetry": {
      "send": true, // assumed false. Actually send pings?
      "removeTestingFlag": false,  // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    },
  },

  // required LOG key
  "log": {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    "bootstrap": {
      // Console.jsm uses "debug", whereas Log.jsm uses "Debug", *sigh*
      "level": "debug",
    },
    "studyUtils":  {
      "level": "Trace",
    },
  },

  // OPTION KEYS

  // a place to put an 'isEligible' function
  // Will run only during first install attempt
  "isEligible": async function() {
    const isGloballyEnabled = Services.prefs.getBoolPref(this.PREF_TP_ENABLED_GLOBALLY);
    const isPBModeOnly = Services.prefs.getBoolPref(this.PREF_TP_ENABLED_IN_PRIVATE_WINDOWS);
    // Has user enabled TP globally?
    if (isGloballyEnabled) {
      return false;
    // Has user disabled TP globally?
    } else if (!isPBModeOnly) {
      return false;
    }
    return true;
  },

  /* Study branches and sample weights */
  // TODO bdanforth: Finalize branches and weights
  "weightedVariations": [
    // Built-in TP ON in Private Windows only, no study UI
    {"name": "control",
      "weight": 1},
    // Built-in TP ON globally, no study UI
    {"name": "pseudo-control",
      "weight": 1},
    // Built-in TP OFF globally, re-implemented ON globally in study, study UI shows "fast" messaging
    {"name": "fast",
      "weight": 1},
    // Built-in TP OFF globally, re-implemented ON globally in study, study UI shows "private etc." messaging
    {"name": "private",
      "weight": 1},
  ],


  // Optional: relative to bootstrap.js in the xpi
  "studyUtilsPath": `./StudyUtils.jsm`,
};
