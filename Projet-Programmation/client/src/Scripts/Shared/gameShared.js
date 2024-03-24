/**
 * Récupére toute les images .png du dossier d'un jeu
 * @param {string} gameName nom du dossier du jeu (normalement toujours le nom du jeu)
 * @returns {object} Dictionnaire ayant pour clé "./" + card.valeur + "-" + card.enseigne + ".png" et pour valeur sa référence
 */ 
function importImages(gameName){
    const importAll = (context) => {
        return Object.fromEntries(
            context.keys().map((key) => [key, context(key)])
        );
    };
    return importAll(require.context('../../Assets/img/Memory', false, /\.(png)$/));
}

function circlePoints(r, nb) {
    const radius = r;
    const angleIncrement = (2 * Math.PI) / nb;
    const positions = [];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < nb; i++) {
        const angle = i * angleIncrement;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
    }
    return positions;
}

function generatePointWonCards(nb, widthCards, heightCards) {
    const listPoints = [];
    const rows = Math.ceil(nb / 5); 
    const cols = Math.min(nb, 5); 
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x; 
        if (index >= nb) break; 
        listPoints.push({
          x: x * widthCards, 
          y: 150+ y * heightCards 
        });
      }
    }
  
    return listPoints;
  }
function generatePointCards(nb, widthCards, heightCards) {
    const width = window.innerWidth;
    const listPoints = [];
    const ecart = (width - widthCards - 500) / (nb - 1) //-500 pour éviter de déborder sur le chat --> notez qu'il faudrait aussi rendre l'affichage du chat dynamique...

    for (var i = 0; i < nb; i++) {
        var x = widthCards + i * ecart;
        listPoints.push(x);
    }
    return {
        'y': window.innerHeight - heightCards - 100,
        'x': listPoints
    }
}

function cardImgName(card) {
    return "./" + card.valeur + "-" + card.enseigne + ".png";
}

function quadrillagePoints(x, y, cardSpacingX, cardSpacingY) {
    const itemsCount = x * y;
    const itemsPerRow = x; // Nombre d'items par ligne
    const positions = [];

    for (let index = 0; index < itemsCount; index++) {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = (col * cardSpacingX) - (400 - cardSpacingX / 2);
        const y = (row * cardSpacingY) - (400 - cardSpacingY / 2);
        if (positions[row] === undefined) {
            // Si la ligne n'existe pas encore, créez-la
            positions[row] = [];
        }
        positions[row].push({ x, y });
    }

    return positions;
}

/*function Draw() {
    const { Info, images } = useOutletContext()
    const draw = Info.draw ? Info.draw : 0;
    const [midX, setMidX] = useState(window.innerWidth / 2);
    const [midY, setMidY,] = useState(window.innerHeight / 2);
    useEffect(() => {
        const handleResize = () => {
            setMidX(window.innerWidth / 2);
            setMidY(window.innerHeight / 2);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div>
            <p style={{ position: 'absolute', left: `${midX - 50}px`, top: `${midY - 50}px` }}>Il y a : {draw} cartes dans la pioche</p>
            <Card x={midX} y={midY} />
        </div>
    );

    function Center() {
    const { Info } = useOutletContext()
    const [cardsPositions, setCardsPositions] = useState([]);
    const center = Info.center;
    var numberOfCards = center ? center.length : 0;
    useEffect(() => {
        const handleResize = () => {
            setCardsPositions(circlePoints(100, numberOfCards));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    },[numberOfCards]);

    return (
        <div>
            {cardsPositions.map((position, index) => (
                <Card x={position.x} y={position.y} value={center[index]} />
            ))}
        </div>
    );
}
}*/


export  {cardImgName,importImages,generatePointCards,generatePointWonCards,circlePoints,quadrillagePoints}
