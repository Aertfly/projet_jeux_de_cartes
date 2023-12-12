import { io } from "../server.js";

io.on("tchat_partie", (socket) => {
  socket.on('message', data => {
    // data doit contenir IdJoueur, IdPartie, et le username
    let username = "Erreur : le pseudo n'est pas récupéré";

    if (!data.message) {
      throw new Error("Le message est vide");
    }
    if (!data.IdPartie) {
      throw new Error("L'identifiant de la partie est vide");
    }
    if (!data.IdJoueur) {
      throw new Error("L'identifiant du joueur est vide");
    }

    const db = mysql.createConnection({
      host: 'rateapp.fr',
      user: 'cp2253952p22_projetprogrammation',
      password: 'azertyu123!',
      database: 'cp2253952p22_projetprogrammation'
    });
    
    db.query("SELECT username FROM joueur WHERE id_joueur = ?", [data.IdJoueur], (err, results) => {
      if (err) {
        console.log(err);
        return;
      }
    
      username = results[0].username;
    });

    const messageFormate = `${username} : ${message}`;
    io.to(IdPartie).emit("tchat_partie", messageFormate);
  });
});
