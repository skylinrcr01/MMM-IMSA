Module.register("MMM-IMSA", {
  defaults: {
    header: "IMSA 2026",
    logoUrl: "",
    logoAlt: "IMSA",
    logoWidth: 90,
    showPast: false,
    dateFormat: "MMM D",
    highlightNext: true,
    maxRaces: 3,
    useEventInfo: true,
    eventInfoYear: null,
    eventInfoUrl: "",
    races: [
      {
        name: "Rolex 24 At Daytona",
        start: "2026-01-21",
        end: "2026-01-25",
        track: "Daytona International Speedway",
        location: "Daytona Beach, FL",
        duration: "24 Hours"
      },
      {
        name: "Mobil 1 Twelve Hours of Sebring",
        start: "2026-03-18",
        end: "2026-03-21",
        track: "Sebring International Raceway",
        location: "Sebring, FL",
        duration: "12 Hours"
      },
      {
        name: "Acura Grand Prix of Long Beach",
        start: "2026-04-17",
        end: "2026-04-18",
        track: "Long Beach Street Circuit",
        location: "Long Beach, CA",
        duration: "100 Minutes"
      },
      {
        name: "WeatherTech Raceway Laguna Seca",
        start: "2026-05-01",
        end: "2026-05-03",
        track: "WeatherTech Raceway Laguna Seca",
        location: "Monterey, CA",
        duration: "2 Hours 40 Minutes"
      },
      {
        name: "Chevrolet Detroit Grand Prix Presented By Lear",
        start: "2026-05-29",
        end: "2026-05-30",
        track: "Detroit Street Circuit",
        location: "Detroit, MI",
        duration: "100 Minutes"
      },
      {
        name: "Sahlen's Six Hours of The Glen",
        start: "2026-06-25",
        end: "2026-06-28",
        track: "Watkins Glen International",
        location: "Watkins Glen, NY",
        duration: "6 Hours"
      },
      {
        name: "Chevrolet Grand Prix",
        start: "2026-07-10",
        end: "2026-07-12",
        track: "Canadian Tire Motorsport Park",
        location: "Bowmanville, Ontario",
        duration: "2 Hours 40 Minutes"
      },
      {
        name: "Motul SportsCar Endurance Grand Prix",
        start: "2026-07-30",
        end: "2026-08-02",
        track: "Road America",
        location: "Elkhart Lake, WI",
        duration: "6 Hours"
      },
      {
        name: "Michelin GT Challenge at VIR",
        start: "2026-08-20",
        end: "2026-08-23",
        track: "VIRginia International Raceway",
        location: "Alton, VA",
        duration: "2 Hours 40 Minutes"
      },
      {
        name: "TireRack.com Battle On The Bricks",
        start: "2026-09-18",
        end: "2026-09-20",
        track: "Indianapolis Motor Speedway",
        location: "Indianapolis, IN",
        duration: "2 Hours 40 Minutes"
      },
      {
        name: "Motul Petit Le Mans",
        start: "2026-10-01",
        end: "2026-10-03",
        track: "Michelin Raceway Road Atlanta",
        location: "Braselton, GA",
        duration: "10 Hours"
      }
    ]
  },

  getStyles: function () {
    return ["MMM-IMSA.css"];
  },

  start: function () {
    this.races = this.normalizeRaces(this.config.races || []);

    if (this.config.useEventInfo) {
      this.sendSocketNotification("IMSA_REQUEST", {
        year: this.getSeasonYear(),
        url: this.config.eventInfoUrl
      });
    }
  },

  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.className = "imsa-wrapper";

    var title = document.createElement("div");
    title.className = "imsa-title";
    if (this.config.logoUrl) {
      var logo = document.createElement("img");
      logo.className = "imsa-logo";
      logo.src = this.config.logoUrl;
      logo.alt = this.config.logoAlt;
      logo.style.width = this.config.logoWidth + "px";
      title.appendChild(logo);
    } else {
      title.innerText = this.config.header;
    }
    wrapper.appendChild(title);

    var now = moment().startOf("day");
    var nextIndex = -1;
    for (var i = 0; i < this.races.length; i += 1) {
      if (this.races[i].end.isSameOrAfter(now, "day")) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex >= 0) {
      var nextRace = this.races[nextIndex];
      var details = document.createElement("div");
      details.className = "imsa-details";
      var isCurrent =
        nextRace.start.isSameOrBefore(now, "day") &&
        nextRace.end.isSameOrAfter(now, "day");
      if (isCurrent) {
        details.classList.add("imsa-details-current");
      }

      var detailsTitle = document.createElement("div");
      detailsTitle.className = "imsa-details-title";
      detailsTitle.innerText = isCurrent
        ? "Current race details"
        : "Next race details";
      details.appendChild(detailsTitle);

      details.appendChild(this.detailLine("Race", nextRace.name));
      details.appendChild(this.detailLine("Location", nextRace.location));
      details.appendChild(this.detailLine("Dates", this.formatRange(nextRace)));
      if (nextRace.duration) {
        details.appendChild(this.detailLine("Duration", nextRace.duration));
      }

      wrapper.appendChild(details);
    }

    var list = document.createElement("div");
    list.className = "imsa-list";

    var maxRaces = this.config.maxRaces;
    var shownCount = 0;
    var startIndex = this.config.showPast ? 0 : Math.max(nextIndex, 0);

    for (var j = startIndex; j < this.races.length; j += 1) {
      var race = this.races[j];
      var isPast = race.end.isBefore(now, "day");
      if (!this.config.showPast && isPast) {
        continue;
      }

      if (maxRaces && shownCount >= maxRaces) {
        break;
      }

      var row = document.createElement("div");
      row.className = "imsa-row";
      if (isPast) {
        row.classList.add("imsa-past");
      }
      if (this.config.highlightNext && j === nextIndex) {
        row.classList.add("imsa-next");
      }

      var name = document.createElement("div");
      name.className = "imsa-name";
      name.innerText = race.name;

      var date = document.createElement("div");
      date.className = "imsa-date";
      date.innerText = this.formatRange(race);

      row.appendChild(name);
      row.appendChild(date);
      list.appendChild(row);
      shownCount += 1;
    }

    wrapper.appendChild(list);

    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "IMSA_EVENTS" && payload && payload.races) {
      if (payload.races.length > 0) {
        this.races = this.normalizeRaces(payload.races);

        if (this.config.header === this.defaults.header && payload.year) {
          this.config.header = "IMSA " + payload.year;
        }
      }
      this.updateDom();
    }
  },

  normalizeRaces: function (races) {
    return (races || []).map(function (race) {
      return {
        name: race.name,
        start: moment(race.start, "YYYY-MM-DD"),
        end: moment(race.end, "YYYY-MM-DD"),
        track: race.track,
        location: race.location,
        duration: race.duration
      };
    });
  },

  getSeasonYear: function () {
    return this.config.eventInfoYear || moment().year();
  },

  formatRange: function (race) {
    var start = race.start.format(this.config.dateFormat);
    var end = race.end.format(this.config.dateFormat);
    return start + " - " + end;
  },

  detailLine: function (label, value) {
    var line = document.createElement("div");
    line.className = "imsa-detail-line";

    var labelEl = document.createElement("span");
    labelEl.className = "imsa-detail-label";
    labelEl.innerText = label + ": ";

    var valueEl = document.createElement("span");
    valueEl.className = "imsa-detail-value";
    valueEl.innerText = value;

    line.appendChild(labelEl);
    line.appendChild(valueEl);
    return line;
  }
});
