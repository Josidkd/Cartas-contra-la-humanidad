// Variables globales
let numeroJugadores;
let jugadores = [];
let cartasPreguntaUsadas = []; // 59
let cartasRespuestaUsadas = [];  // 394
let jugadorZar;
let cartaZar;
let rondas;
let preguntaLeida = false;
// Respuestas
let respuestasJugador = [];
let respuestasCarta = [];
 /*-------------------------------------------------- INICIO ---------------------------------------------------*/
 let creaPartida = () => {
  	let numJugadores = document.getElementById("numJugadores").value;
    if(numJugadores > 2 && numJugadores < 16){
      numeroJugadores = numJugadores;
      document.getElementById("inicio-app").classList.add("oculto");
      document.getElementById("crear-jugadores").classList.remove("oculto");
      creaFormularioJugadores(numJugadores);
    }else{
      alert("El número de jugadores no es correcto");
    }
  }

 let creaFormularioJugadores = numJugadores => {
  	let divJugadores="";
  	for(let i=1; i <= numJugadores; i++){
  		divJugadores+=`<p>Nombre del jugador ${i}:</p><input name="inputNombre" class="input1" type="text">`;
  	}
  	document.getElementById("formularioJugadores").innerHTML = divJugadores;
  }

  let creaJugadores = () => {
    let okJugadores = true;
    for(let i=0; i < numeroJugadores; i++){
      if(document.getElementsByName("inputNombre")[i].value == ""){
         okJugadores = false;
      }
    }
    if(document.getElementById("numRondas").value > 10 || document.getElementById("numRondas").value < 2){
      okJugadores = false;
    }

    if(okJugadores){
      for(let i=0; i < numeroJugadores; i++){
      let jugador = new Object;
      jugador.nombre = document.getElementsByName("inputNombre")[i].value;
      jugador.rondasGanadas = 0;
      jugador.cartas = [];
      jugador.estadoRonda = false;
      jugadores[i]= jugador;
     } // Dá valor al array de jugadores
     rondas = document.getElementById("numRondas").value; // Dice el número de rondas
     empiezaPartida();
    }else{
      alert("Hay algún campo mal, revisalos");
    }
 }

let empiezaPartida = () => {
  	for(let i=0; i< numeroJugadores; i++){
  		while(jugadores[i].cartas.length < 10){
  			reparteCarta(i);
  		}
  		console.log(jugadores[i]);
  	} // Reparte cartas a los jugadores
  	jugadorZar = 0;
  	reparteCartaZar(0);
    controlPartida();
}
/*------------------------------------------------------ CONTROL DE LA PARTIDA --------------------------------------------------*/
let reparteCarta = nJugador => {
  if(cartasRespuestaUsadas.length == 393){
    alert("NO QUEDAN RESPUESTAS NUEVAS, LAS PRÓXIMAS SE VAN A REPETIR");
    alert(jugadores.length);
    cartasRespuestaUsadas = [];
    for(let i = 0; i < jugadores.length; i++){
      alert(jugadores[i].cartas.length);
      for(let x = 0; x < jugadores[i].cartas.length; x++){
        cartasRespuestaUsadas.push(jugadores[i].cartas[x]);
      }
    } // Resetea las cartas usadas y apunta las que están en la mano de los jugadores
  }
	let repetida = false;
	let carta = Math.floor(Math.random() * (393 - 0)) + 0;
	for(let z=0; z < cartasRespuestaUsadas.length; z++){
		if(cartasRespuestaUsadas[z] == carta){
			repetida = true;
		}
	}
	if (repetida == false){
		cartasRespuestaUsadas.push(carta); // Actualiza las cartas usadas
		jugadores[nJugador].cartas.push(carta); // Actualiza las cartas del jugador
	}
}

let reparteCartaZar = nJugador => {
  if(cartasPreguntaUsadas.length == 58){
    alert("NO QUEDAN PREGUNTAS NUEVAS, LAS PRÓXIMAS SE VAN A REPETIR");
    cartasPreguntaUsadas = [];
  }
	let repetida = false;
	let carta = Math.floor(Math.random() * (58 - 0)) + 0;
	for(let z=0; z < cartasPreguntaUsadas.length; z++){
		if(cartasPreguntaUsadas[z] == carta){
			repetida = true;
		}
	}
	if (repetida == false){
		cartasPreguntaUsadas.push(carta); // Actualiza las cartas usadas
		cartaZar = carta;
	}
}

let controlPartida = () => {
  //numeroJugadores
  if(rondas > 0){
    // Juega ronda
    if(preguntaLeida == false){
      iniciaTurno(jugadorZar,"zar");
    }else{
      let finRonda = true;
      // Controlar los que quedan por jugar
      for(let i=0; i< numeroJugadores; i++){
        if(jugadores[i].estadoRonda == false && i != jugadorZar){
          finRonda = false;
          iniciaTurno(i,"jugador");
          break;
        }
      }
      if(finRonda == true){
          avisoVoto();
      }
    }
  }else{
    // Mostrar puntuaciones
    document.getElementById("fin").classList.remove("oculto");
    let clasificacion = "";
    for(let i = 0; i < numeroJugadores; i++){
      clasificacion +=`<p>${jugadores[i].nombre} : ${jugadores[i].rondasGanadas}  rondas ganadas</p>`;
    }
    document.getElementById("puntuaciones").innerHTML = `<h1>La clasificación ha quedado así:</h1>${clasificacion}`;
  }
}

let iniciaTurno = (jugador,tipo) => {
	document.getElementById("crear-jugadores").classList.add("oculto");
  document.getElementById("pantallaGenerica").classList.remove("oculto");
  if(tipo == "zar"){
    document.getElementById("divContenido").innerHTML = `
    <h2>Turno de </h2>
    <h1>${jugadores[jugador].nombre}</h1>
    <p>Eres el ZAR. Lee la carta en alto para que puedan responder el resto de jugadores</p>
    <button class="btn1 bottom" onclick="turnoZar()">Ver pregunta</button>`;
  }else{
    document.getElementById("divContenido").innerHTML = `
    <h2>Turno de </h2>
    <h1>${jugadores[jugador].nombre}</h1>
    <p>Responde a la pregunta</p>
    <button class="btn1 bottom" onclick="turnoJugador(${jugador})">Ver respuestas</button>`;
  }	
}

let turnoZar = () => {
  preguntaLeida = true;
  document.getElementById("divContenido").innerHTML = `
    <div class="cartaZarDiv animated fadeInLeft">
      <h2>${cartasPregunta[cartaZar]}</h2>
    </div>
    <button class="btn1 bottom" onclick="controlPartida()">Siguiente</button>
  `;
}

let turnoJugador = nJugador => {
  jugadores[nJugador].estadoRonda = true;
  let respuestas="";
  for(let i = 0; i< 10; i++){
    respuestas +=`
      <button class="respuesta animated fadeInLeft" onclick="vota(${nJugador},${jugadores[nJugador].cartas[i]})">
        <h2>${cartasRespuesta[jugadores[nJugador].cartas[i]]}</h2>
      </button>
    `;
  }
  document.getElementById("divContenido").innerHTML = `
    <p>Pregunta</p>
    <div class="cartaZarDiv animated fadeInLeft">
      <h2>${cartasPregunta[cartaZar]}</h2>
    </div>
    <p>Respuestas</p>
    <div id="respuestas">${respuestas}</div>
  `;
}

let vota = (nJugador,carta) => {
  // Añade la respuesta y el jugador a los arrays de respuestas
  respuestasJugador.push(nJugador);
  respuestasCarta.push(carta);
  // Borra la carta usada del jugador
  for(let i = 0; i < 10; i++){
    if(jugadores[nJugador].cartas[i] == carta){
      jugadores[nJugador].cartas.splice(i, 1);
    }
  } 
  //Reparte carta nueva;
  while(jugadores[nJugador].cartas.length < 10){
    reparteCarta(nJugador);
  }
  //Pasa turno
  controlPartida();
}

let avisoVoto = () => {
  document.getElementById("divContenido").innerHTML = `
    <h2>Turno de </h2>
    <h1>${jugadores[jugadorZar].nombre}</h1>
    <h2>Ahora el ZAR vota la respuesta que más le guste</h2>
    <button class="btn1 bottom" onclick="votaRespuestas()">Votar</button>
  `;

}

let votaRespuestas = () => {
  let respuestas="";
  for(let i = 0; i < numeroJugadores-1; i++){
    let pregunta = cartasPregunta[cartaZar];
    
    if(pregunta.includes('______')){
      pregunta = pregunta.replace("______", cartasRespuesta[respuestasCarta[i]]);
    }else{
      pregunta = pregunta+" "+cartasRespuesta[respuestasCarta[i]];
    }
    respuestas+=`
      <button class="respuesta" onclick="ganaRonda(${respuestasJugador[i]})">
        <h2>${pregunta}</h2>
      </button>
    `;
  }

  document.getElementById("divContenido").innerHTML = `
    <p>Respuestas</p>
    <div id="respuestas">${respuestas}</div>
  `;
}

let ganaRonda = nJugador => {
  alert("Gana la ronda: "+jugadores[nJugador].nombre);
  jugadores[nJugador].rondasGanadas++;
  cambioRonda();
}

let cambioRonda = () => {
    console.log("NUEVA RONDA");
    console.log("Cartas pregunta usadas: "+cartasPreguntaUsadas.length);
    console.log("Cartas respuesta usadas: "+cartasRespuestaUsadas.length);
    preguntaLeida = false;
    for(let i = 0; i < numeroJugadores; i++){
      jugadores[i].estadoRonda = false;
      console.log(jugadores[i]);
    }
    ;
    //cambia zar
    jugadorZar++;
    if(jugadorZar > numeroJugadores-1){
      jugadorZar = 0;
    }
    //vacía arrays de respuestas
    respuestasJugador = [];
    respuestasCarta = [];
    //cambia carta zar
    cartaZar="";
    while(cartaZar == ""){
      reparteCartaZar(jugadorZar);
    }
    //quitar ronda
    rondas--;
    //iniciar ronda
    document.getElementById("pantallaGenerica").classList.add("oculto");
    //iniciaTurno(jugadorZar,"zar");
    controlPartida();
}

let reiniciarJuego = () => {
  location.reload();
}