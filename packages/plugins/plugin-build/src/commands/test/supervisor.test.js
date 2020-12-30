const supervisor = require("../supervisor/index");

test (`ensure formatTimestampDifference copes with a variety of time ranges`,() => {
  const from = 0;
  const checkFiveHundredMilliseconds = 500;
  const checkOneSecond = 1000;
  const checkSixPointThreeSeconds = 6.3 * 1000;
  const checkTwoMinutesSevenSeconds = 2 * 60 * 1000 + (7 * 1000);
  const checkTenMinutes = 10 * 60 * 1000;

  expect(supervisor.formatTimestampDifference(from, checkFiveHundredMilliseconds)).toBe(`0.50s`);
  expect(supervisor.formatTimestampDifference(from, checkOneSecond)).toBe(`1.00s`);
  expect(supervisor.formatTimestampDifference(from, checkSixPointThreeSeconds)).toBe(`6.30s`);
  expect(supervisor.formatTimestampDifference(from, checkTwoMinutesSevenSeconds)).toBe(`2m 7.00s`);
  expect(supervisor.formatTimestampDifference(from, checkTenMinutes)).toBe(`10m`);
});
