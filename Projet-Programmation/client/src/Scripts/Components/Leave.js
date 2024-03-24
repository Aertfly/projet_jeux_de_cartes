import { useNavigate } from 'react-router-dom';

function Leave(props) {
    const  socket = props.socket
    const  idJ = props.idj
    const navigate = useNavigate();
    if(!idJ || !socket){
        console.log("Erreur paramètre manquant pour le bouton 'leave'")
        return;
    }
    function clicked() {
        socket.emit('playerLeaving', idJ);
        navigate('/home');
    }
    return (
        <button type='button' onClick={clicked}>Quitter</button>
    );
}

export default Leave;