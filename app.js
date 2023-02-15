const express = require("express");
const { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");

let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "covid19India.db");

let db = null;

let funcToGetDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server run at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
};

funcToGetDatabase();

// SAMPLE GET

app.get("/", (request, response) => {
  response.send("Hi");
});

// Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const peopleQuery = await `SELECT * FROM state ORDER BY state_id;`;
  let peoples = await db.all(peopleQuery);
  let funcObjConvert = (eachObj) => {
    return {
      stateId: eachObj.state_id,
      stateName: eachObj.state_name,
      population: eachObj.population,
    };
  };
  let newArr = [];
  for (let eachObj of peoples) {
    let newObj = funcObjConvert(eachObj);
    newArr.push(newObj);
  }
  response.send(newArr);
});

// /states/:stateId/  | Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  const getpersonQuery = await `SELECT * FROM state WHERE state_id = ${stateId};`;
  let personObj = await db.get(getpersonQuery);
  let funcObjConvert = (personObj) => {
    return {
      stateId: personObj.state_id,
      stateName: personObj.state_name,
      population: personObj.population,
    };
  };
  let newArr = funcObjConvert(personObj);
  response.send(newArr);
});

// API 3 POST  /districts/ | returns District Successfully Added

app.post("/districts/", async (request, response) => {
  let userData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = userData;
  let insertQuery = await `INSERT INTO district( district_name, state_id, cases, cured, active, deaths)
        VALUES ( '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  let insertData = await db.run(insertQuery);
  response.send("District Successfully Added");
});

// API 4 GET /districts/:districtId/

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let getDistrict = await `SELECT * FROM district WHERE district_id = ${districtId};`;
  let districtObj = await db.get(getDistrict);
  let funcObjConvert = (districtObj) => {
    return {
      districtId: districtObj.district_id,
      districtName: districtObj.district_name,
      stateId: districtObj.state_id,
      cases: districtObj.cases,
      cured: districtObj.cured,
      active: districtObj.active,
      deaths: districtObj.deaths,
    };
  };

  let newObj = funcObjConvert(districtObj);
  response.send(newObj);
});

// API 5 DELETE /districts/:districtId/ | response District Removed

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = await request.params;
  const deleteDistrictQuery = `DELETE FROM district
    WHERE district_id = ${districtId};`;
  let districtDeleted = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6 PUT /districts/:districtId/ | response District Details Updated

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = await request.params;
  let districtNewData = await request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtNewData;

  let updateDistrictQuery = await `UPDATE district
    SET district_name = '${districtName}', 
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE  district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 GET Path: /states/:stateId/stats/  Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = await request.params;

  let statsQuery = await `SELECT SUM(cases) AS totalCases,
   SUM(cured) AS totalCured,
   SUM(active) AS totalActive,
   SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};`;

  // console.log(statsQuery);
  let newArr = await db.get(statsQuery);
  // console.log(newArr);
  response.send(newArr);
});

// API 8 GET Path: /districts/:districtId/details/

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let stateIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId};`;
  let stateId = await db.get(stateIdQuery);
  let stateNameId = stateId.state_id;
  let stateNameQuery = `SELECT state_name FROM state WHERE state_id = ${stateNameId};`;
  let stateName = await db.get(stateNameQuery);
  let funcObjConvert = (stateObj) => {
    return {
      stateName: stateObj.state_name,
    };
  };

  let newStateObj = funcObjConvert(stateName);
  response.send(newStateObj);
});

module.exports = app;
