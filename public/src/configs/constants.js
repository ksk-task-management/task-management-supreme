import * as helpers from "../utils/helpers";

//Card scores
export const scorePerDaysToEnd = 200;
export const scorePerDaysPassedStart = 135;
export const scorePerDaysPassedEnd = 250;

export const scorePercentPerIncompleteArea = 15;


//Datetime
export const timeConvertionUnits = [
  {
    name: "Year",
    abbreviation: "Y",
    value: 1000 * 60 * 60 * 24 * 365
  },
  {
    name: "Trimester",
    abbreviation: "tM",
    value: 1000 * 60 * 60 * 24 * 30 * 3
  },
  {
    name: "Month",
    abbreviation: "M",
    value: 1000 * 60 * 60 * 24 * 30
  },
  {
    name: "Week",
    abbreviation: "w",
    value: 1000 * 60 * 60 * 24 * 7
  },
  {
    name: "Day",
    abbreviation: "d",
    value: 1000 * 60 * 60 * 24
  },
  {
    name: "Hour",
    abbreviation: "h",
    value: 1000 * 60 * 60
  },
  {
    name: "Minute",
    abbreviation: "min",
    value: 1000 * 60
  }
];

export const dayOfWeekList = [
  {
    name: "Monday",
    abbreviation: "Mon",
    colorHex: "#e8d968ff"
  },
  {
    name: "Tuesday",
    abbreviation: "Tue",
    colorHex: "#eb63e4"
  },
  {
    name: "Wednesday",
    abbreviation: "Wed",
    colorHex: "#63eba0"
  },
  {
    name: "Thursday",
    abbreviation: "Thu",
    colorHex: "#eba263"
  },
  {
    name: "Friday",
    abbreviation: "Fri",
    colorHex: "#6397eb"
  },
  {
    name: "Saturday",
    abbreviation: "Sat",
    colorHex: "#9563eb"
  },
  {
    name: "Sunday",
    abbreviation: "Sun",
    colorHex: "#eb637e"
  }
]