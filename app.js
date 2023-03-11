const express = require("express");
const path = require("path");

const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
// Connecting the server and database
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is up and running");
    });
  } catch (e) {
    console.log(`Db error ${e}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetailsSnakeToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayerDetails = `
        SELECT * FROM player_details;
    `;
  const allPLayersDetails = await db.all(getPlayerDetails);
  response.send(
    allPLayersDetails.map((eachPlayer) =>
      convertPlayerDetailsSnakeToCamelCase(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayersQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};
  `;
  const playerDetails = await db.get(getPlayersQuery);

  response.send({
    playerId: playerDetails.player_id,
    playerName: playerDetails.player_name,
  });
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerDetails = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT * FROM match_details WHERE match_id = ${matchId};
    `;

  const matchDetails = await db.get(getMatchDetails);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

const convertPlayerMatchDetailsSnakeToCamelCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
        SELECT
        *
        FROM player_match_score 
        NATURAL JOIN match_details
        WHERE
        player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatches);
  response.send(
    playerMatches.map((eachMatch) =>
      convertPlayerMatchDetailsSnakeToCamelCase(eachMatch)
    )
  );
});

const converMatchPlayerSnakeToCamel = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayers = `
        SELECT
        *
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE
        match_id = ${matchId};
    `;

  const matchPlayers = await db.all(getMatchPlayers);
  response.send(
    matchPlayers.map((eachPlayer) => converMatchPlayerSnakeToCamel(eachPlayer))
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});
module.exports = app;
