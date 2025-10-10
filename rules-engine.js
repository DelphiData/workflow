/**
 * HospitalA — Navigator Follow-Up Logic (FIRST match)
 *
 * This file contains the logic engine.
 * It loads its rules from 'rules.yaml' to allow for easy updates
 * without changing the application code.
 */

// Required libraries to read files and parse YAML
const fs = require('fs');
const yaml = require('js-yaml');

/* =========================
   LOAD RULES FROM YAML FILE
   ========================= */
// This single line replaces the entire hard-coded 'var RULES = [...]' block.
// Now, your business logic lives entirely in the rules.yaml file.
const RULES = yaml.load(fs.readFileSync('./rules.yaml', 'utf8'));


/* ==================================================================
   THE REST OF THIS FILE IS YOUR ORIGINAL ENGINE CODE - UNCHANGED
   ================================================================== */

/* =========================
   Enumerations (outputs)
   ========================= */
var ACTIONS = {
  AUTO_CLOSE: 'auto_close',
  MARK_DONE: 'mark_followup_complete',
  SCHEDULE: 'schedule_imaging',
  NOTIFY_PROVIDER: 'notify_provider',
  NOTIFY_PATIENT: 'notify_patient_letter',
  REFER: 'refer_specialist',
  ESCALATE: 'escalate_review',
  NO_ACTION: 'no_action'
};

var COMMS = {
  NONE: 'none',
  EMR: 'EMR_message',
  FAX: 'fax',
  PHONE: 'phone',
  LETTER: 'letter',
  LETTER_FAX: 'letter+fax',
  PHONE_EMR: 'phone+EMR'
};

/* =========================
   Mini engine (FIRST policy)
   ========================= */
function isWildcard(v) {
  return v === '*' || v === undefined || v === null;
}

var ops = {
  eq: function(a,b){ return a === b; },
  ne: function(a,b){ return a !== b; },
  lt: function(a,b){ return typeof a === 'number' && a < b; },
  lte: function(a,b){ return typeof a === 'number' && a <= b; },
  gt: function(a,b){ return typeof a === 'number' && a > b; },
  gte: function(a,b){ return typeof a === 'number' && a >= b; },
  in: function(a,arr){ return Array.isArray(arr) && arr.indexOf(a) !== -1; },
  contains: function(arr,v){ return Array.isArray(arr) && arr.indexOf(v) !== -1; }
};

function matchField(inputVal, cond) {
  if (isWildcard(cond)) return true;

  // literal OR array-of-allowed
  if (typeof cond !== 'object' || Array.isArray(cond)) {
    if (Array.isArray(cond)) return cond.indexOf(inputVal) !== -1;
    return inputVal === cond;
  }
  // operator object
  for (var k in cond) {
    if (!cond.hasOwnProperty(k)) continue;
    var rhs = cond[k];
    if (k === 'contains') {
      if (!ops.contains(inputVal, rhs)) return false;
    } else if (k === 'in') {
      if (!ops.in(inputVal, rhs)) return false;
    } else {
      if (!ops[k]) return false;
      if (!ops[k](inputVal, rhs)) return false;
    }
  }
  return true;
}

function ruleMatches(input, when) {
  for (var key in when) {
    if (!when.hasOwnProperty(key)) continue;
    var ok = matchField(input[key], when[key]);
    if (!ok) return false;
  }
  return true;
}

function solve(input) {
  for (var i=0; i<RULES.length; i++) {
    var r = RULES[i];
    if (ruleMatches(input, r.when)) {
      var out = {};
      for (var k in r.then) out[k] = r.then[k];
      //out.matchedRule = r.id ? String(r.id) : null; // You can uncomment this for debugging
      return out;
    }
  }
  // default fallback (nothing matched)
  return {
    navigatorAction: ACTIONS.NOTIFY_PROVIDER,
    communicationMode: 'EMR_message',
    specialistReferral: 'primary_care',
    followUpInterval_months: 0,
    priority: 'low',
    _matchedRule: 'DEFAULT_FALLBACK'
  };
}

/* =========================
   Example Usage (for testing)
   ========================= */

// To test this file directly, you can uncomment the lines below and run 'node rules-engine.js' in your terminal.
/*
const sampleInput = {
  findingFamily: 'lung',
  findingType: 'screening_nodule',
  radsSystem: 'Lung-RADS',
  radsCategory: 'Lung-RADS 4A'
};

const result = solve(sampleInput);

console.log("Input:", sampleInput);
console.log("Result:", result);
// Expected Result: { navigatorAction: 'schedule_imaging', communicationMode: 'EMR_message', specialistReferral: 'lung_clinic', followUpInterval_months: 1, priority: 'high' }
*/


// This makes the solve function available to other files if you were to 'require' it.
module.exports = { solve };
