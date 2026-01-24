var NodeHelper = require("node_helper");
var https = require("https");
var http = require("http");

var MONTHS = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Sept: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12
};

module.exports = NodeHelper.create({
  start: function () {
    this.cache = {};
    this.cacheTtlMs = 7 * 24 * 60 * 60 * 1000;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification !== "IMSA_REQUEST") {
      return;
    }

    var year = (payload && payload.year) || new Date().getFullYear();
    var url = (payload && payload.url) || this.buildEventInfoUrl(year);

    var cached = this.getCached(url);
    if (cached) {
      this.sendSocketNotification("IMSA_EVENTS", {
        year: cached.year || year,
        url: url,
        races: cached.races
      });
      return;
    }

    this.fetchEventInfo(url, function (error, result) {
      if (error) {
        this.sendSocketNotification("IMSA_ERROR", {
          year: year,
          url: url,
          error: error.message
        });
        return;
      }

      this.sendSocketNotification("IMSA_EVENTS", {
        year: result.year || year,
        url: url,
        races: result.races
      });
      this.setCached(url, result);
    }.bind(this));
  },

  buildEventInfoUrl: function (year) {
    return "https://www.imsa.com/competitors/" + year + "-imsa-weathertech-sportscar-championship-event-information/";
  },

  fetchEventInfo: function (url, callback) {
    this.fetchUrl(url, function (error, html) {
      if (error) {
        callback(error);
        return;
      }

      var lines = this.htmlToLines(html);
      var result = this.parseEventInfoLines(lines);

      if (!result.races.length) {
        callback(new Error("No events found in event information page."));
        return;
      }

      callback(null, result);
    }.bind(this));
  },

  getCached: function (url) {
    var entry = this.cache[url];
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.fetchedAt > this.cacheTtlMs) {
      delete this.cache[url];
      return null;
    }

    return entry.data;
  },

  setCached: function (url, result) {
    this.cache[url] = {
      fetchedAt: Date.now(),
      data: result
    };
  },

  fetchUrl: function (url, callback, redirects) {
    var attempts = redirects || 0;
    var client = url.indexOf("https://") === 0 ? https : http;

    client
      .get(url, function (response) {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          if (attempts >= 4) {
            callback(new Error("Too many redirects."));
            return;
          }
          this.fetchUrl(response.headers.location, callback, attempts + 1);
          return;
        }

        if (response.statusCode !== 200) {
          callback(new Error("Request failed with status " + response.statusCode + "."));
          return;
        }

        var data = "";
        response.setEncoding("utf8");
        response.on("data", function (chunk) {
          data += chunk;
        });
        response.on("end", function () {
          callback(null, data);
        });
      }.bind(this))
      .on("error", function (error) {
        callback(error);
      });
  },

  htmlToLines: function (html) {
    var text = html
      .replace(/\r\n/g, "\n")
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\s*\/?\s*(h1|h2|h3|h4|h5|p|li|div|section|article|ul|ol|table|tr|td)\b[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, " ");

    text = this.decodeEntities(text);

    return text
      .split("\n")
      .map(function (line) {
        return line.replace(/\s+/g, " ").trim();
      })
      .filter(function (line) {
        return line.length > 0;
      });
  },

  decodeEntities: function (text) {
    var named = {
      "&amp;": "&",
      "&nbsp;": " ",
      "&quot;": '"',
      "&#39;": "'",
      "&apos;": "'",
      "&lt;": "<",
      "&gt;": ">"
    };

    var decoded = text.replace(/&(amp|nbsp|quot|apos|lt|gt);/g, function (match) {
      return named[match] || match;
    });

    decoded = decoded.replace(/&#(\d+);/g, function (match, code) {
      var num = parseInt(code, 10);
      if (Number.isNaN(num)) {
        return match;
      }
      return String.fromCharCode(num);
    });

    return decoded;
  },

  parseEventInfoLines: function (lines) {
    var year = this.findYear(lines);
    if (!year) {
      return { year: null, races: [] };
    }

    var startIndex = -1;
    var yearHeader = year + " Events";

    for (var i = 0; i < lines.length; i += 1) {
      if (lines[i] === yearHeader) {
        startIndex = i + 1;
        break;
      }
    }

    if (startIndex < 0) {
      return { year: year, races: [] };
    }

    var races = [];

    for (var j = startIndex; j < lines.length; j += 1) {
      var line = lines[j];

      if (this.isStopHeader(line, year)) {
        break;
      }

      if (this.isNoiseLine(line) || this.isDateLine(line) || this.isLocationLine(line)) {
        continue;
      }

      var nextDateIndex = this.nextNonNoiseIndex(lines, j + 1);
      if (nextDateIndex < 0 || !this.isDateLine(lines[nextDateIndex])) {
        continue;
      }

      var nextLocationIndex = this.nextNonNoiseIndex(lines, nextDateIndex + 1);
      if (nextLocationIndex < 0 || !this.isLocationLine(lines[nextLocationIndex])) {
        continue;
      }

      var dateRange = this.parseDateRange(lines[nextDateIndex], year);
      if (!dateRange) {
        continue;
      }

      races.push({
        name: line,
        start: dateRange.start,
        end: dateRange.end,
        location: lines[nextLocationIndex]
      });
    }

    return { year: year, races: races };
  },

  findYear: function (lines) {
    for (var i = 0; i < lines.length; i += 1) {
      var match = lines[i].match(/(\d{4}) Events/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  },

  isStopHeader: function (line, year) {
    if (line === year + " Past Events") {
      return true;
    }

    if (/OFFICIAL PARTNERS/i.test(line)) {
      return true;
    }

    return false;
  },

  isNoiseLine: function (line) {
    var lower = line.toLowerCase();
    return (
      lower === "download:" ||
      lower === "resources:" ||
      lower.indexOf("download") === 0 ||
      lower.indexOf("imsa") === 0 && lower.indexOf("event") === -1 ||
      lower.indexOf("presented by") >= 0
    );
  },

  nextNonNoiseIndex: function (lines, start) {
    for (var i = start; i < lines.length; i += 1) {
      if (!this.isNoiseLine(lines[i])) {
        return i;
      }
    }

    return -1;
  },

  isDateLine: function (line) {
    return /[A-Za-z]{3,4} \d{1,2} to [A-Za-z]{3,4} \d{1,2}/.test(line);
  },

  isLocationLine: function (line) {
    return /[A-Za-z].*,\s*[A-Za-z]/.test(line);
  },

  parseDateRange: function (line, year) {
    var parts = line.split(" to ");
    if (parts.length !== 2) {
      return null;
    }

    var start = this.parseMonthDay(parts[0], year);
    var end = this.parseMonthDay(parts[1], year);

    if (!start || !end) {
      return null;
    }

    return {
      start: start,
      end: end
    };
  },

  parseMonthDay: function (text, year) {
    var match = text.trim().match(/^([A-Za-z]{3,4})\s+(\d{1,2})$/);
    if (!match) {
      return null;
    }

    var monthName = match[1];
    var day = parseInt(match[2], 10);
    var month = MONTHS[monthName];

    if (!month || Number.isNaN(day)) {
      return null;
    }

    var monthString = month < 10 ? "0" + month : String(month);
    var dayString = day < 10 ? "0" + day : String(day);

    return year + "-" + monthString + "-" + dayString;
  }
});
