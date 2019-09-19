const execa = require("execa");
const path = require("path");
const KUBECTL_PATH = path.join(__dirname, "kubectl"); // ./

const mongoose = require("mongoose");
const authenticate = require("mm-authenticate")(mongoose);
const { Script, Team } = require("mm-schemas")(mongoose);
const { send, buffer } = require("micro");

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
mongoose.Promise = global.Promise;

module.exports = authenticate(async (req, res) => {
  if (!req.user.admin) {
    send(res, 401, "Error: user does not have admin priveleges.");
    return;
  }

  console.log("Grabbing all teams...");
  const allTeams = await Team.find().populate("latestScript").exec();

  console.log(allTeams);

  console.log("Grabbing all scripts...");
  const allScripts = await Script.find().exec();

  console.log(allScripts);

  if (allTeams.length == 0) {
    send(res, 401, "Error: there are no teams to remove games!");
    return;
  }

  if (allScripts.length == 0) {
    send(rest, 401, "Error: there are no bots to clear!");
    return;
  }

  console.log("Getting latest scripts of all teams...");
  const currentVersions = allTeams.filter(team => team.hasOwnProperty("lastestScript")).map(team => team.latestScript);

  //TODO: Test; remove later
  console.log(currentVersions);

  allScripts.forEach(async (script) => {
    const scriptId = script._id;
    if (!currentVersions.includes(scriptId)) {
      console.log(`Removing old deployment for ${scriptId}`);

      const killDepProc = await execa(KUBECTL_PATH, 
        [  
          "delete", 
          "deployment",
          "-l",
          `bot=${script.key}`
        ]);

      console.log(killDepProc.stdout);
      console.warn(killDepProc.stderr);

      console.log(`Removing old service for ${scriptId}`);

      const killServProc = await execa(KUBECTL_PATH, 
        [  
          "delete", 
          "service",
          "-l",
          `bot=${script.key}`
        ]);

      console.log(killServProc.stdout);
      console.warn(killServProc.stderr);
    }
  });

  send(res, 200, "All old versions removed!");
});
