import { createRestAPIClient } from "masto";

const URL = "https://waterdatafortexas.org/reservoirs/individual/cedar-creek-30day.csv";

function parseData(data) {
  if (!data) { return [];}
  var lines = data.split("\r\n");
  var header = [];
  var results = [];
  
  for(var i = 1; i < lines.length; i++) {
    var line = lines[i];
    if (line.length === 0 || line.startsWith("#") == false) {
      var currentLine = line.split(",");
      var obj = {};
      if (header.length === 0) {
        header = currentLine;
      } else {
        for(var j = 0;j  < header.length; j++) {
          obj[header[j]] = currentLine[j];
        }
        if (obj.date && obj.date.length > 0) results.push(obj);
      }
    }
  }
  return results;
}

const masto = createRestAPIClient({
  url: process.env.MASTODON_URL,
  accessToken: process.env.SECRET_KEY,
});


(async () => {
  const res = await fetch(URL);

  const stats = await res.text();
  const data = parseData(stats);

  const currentDayData = data[data.length - 1];
  const currentValue = currentDayData.water_level;
  const previousDayValue = data[data.length - 2].water_level;
  let trend = "";

  if(currentValue == previousDayValue) {
    trend = `Same as the day before.`;
  } else if (currentValue > previousDayValue) {
    trend = `Up from ${previousDayValue} feet.`;
  } else {
    trend = `Down from ${previousDayValue} feet.`;
  }
  const tootContent = `As of ${currentDayData.date}, the reservoir is at ${currentDayData.percent_full}% capacity with a water level of ${currentDayData.water_level} feet above sea level. ${trend}`;

  const toot = await masto.v1.statuses.create({
    status: tootContent,
  });
  console.log(`Toot: "${tootContent}"`);
  if (toot) {
    console.log(`Toot created at ${toot.url}`);
  } else {
    console.log(`Uh oh, the toot was not posted!`);
  }
})();


