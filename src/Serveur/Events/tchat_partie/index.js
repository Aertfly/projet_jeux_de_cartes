import { io } from "../server.js";

io.on("tchat_partie", (socket) => {
  // Variables à recevoir : [IdPartie, IdJoueur, "message à envoyer"]
  const message = socket.get("message");
  const IdPartie = socket.get("IdPartie");
  const IdJoueur = socket.get("IdJoueur");
  let username = "Erreur : le pseudo n'est pas récupéré";

  if (!message) {
    throw new Error("Le message est vide");
  }
  if (!IdPartie) {
    throw new Error("L'identifiant de la partie est vide");
  }
  if (!IdJoueur) {
    throw new Error("L'identifiant du joueur est vide");
  }

  const db = mysql.createConnection({
    host: 'rateapp.fr',
    user: 'cp2253952p22_projetprogrammation',
    password: 'azertyu123!',
    database: 'cp2253952p22_projetprogrammation'
  });
  
  db.query("SELECT username FROM joueur WHERE id_joueur = ?", [IdJoueur], (err, results) => {
    if (err) {
      console.log(err);
      return;
    }
  
    username = results[0].username;
  });

  const messageFormate = `${username} : ${message}`;
  io.to(IdPartie).emit("tchat_partie", messageFormate);
});
