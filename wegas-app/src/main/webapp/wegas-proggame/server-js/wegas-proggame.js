function sendCommand( cfg ) {
    if ( !checkGameOver()) {
        ret.push( cfg );
    }
}

function move() {
    var object = findObject( cObject );
    switch ( object.direction ) {
        case 1:
            object.y += 1;
            break;
        case 2:
            object.x += 1;
            break;
        case 3:
            object.y -= 1;
            break;
        case 4:
            object.x -= 1;
            break;
    }
    sendMoveCommand();
}
function rotateRight() {
    var object = findObject( cObject );
    object.direction++;
    if (object.direction > 4 ) object.direction = 1;
    sendMoveCommand();
}
function rotateLeft() {
    var object = findObject( cObject );
    object.direction--;
    if (object.direction < 1 ) object.direction = 4;
    sendMoveCommand();
}

function sendMoveCommand() {
    sendCommand({type: 'move', objects: objects.clone()});
}

function fire() {
    var source = findObject( cObject );
    sendCommand({type: 'fire', object: cObject});

    switch (source.direction) {
        case 1:
            for (var i=0; i < 3; i++) {
                checkCollision( cObject, source.x, source.y + i + 1);
            }
            break;
        case 2:
            for (var i=0; i < 3; i++) {
                checkCollision( cObject, source.x + i + 1, source.y);
            }
            break;
        case 3:
            for (var i=0; i < 3; i++) {
                checkCollision( cObject, source.x, source.y - i - 1);
            }
            break;
        case 4:
            for (var i=0; i < 3; i++) {
                checkCollision( cObject, source.x - i - 1, source.y);
            }
            break;
    }
}
function checkCollision( sourceId, x, y ) {
    for (var k=0; k < objects.length; k++) {
        if ( objects[k].x === x && objects[k].y === y && objects[k].id !== sourceId ) {
            objects[k].life = 0;
            sendCommand({type: 'die', object: objects[k].id});
        }
    }
}

function checkWinningCondition() {
    if ( winingCondition()) {
        return true;
    }
    return false;
}
var gameOverSent = false;
function checkGameOver() {
    if ( gameOverSent ) return true;
    if ( checkWinningCondition()) {
        gameOverSent = true;
        sendCommand( {type: "log", text: "You won!" } );
        sendCommand( {type: "gameWon" } );
        return true;
    }
    return false;
}
function findObject(id){
    for ( var i = 0; i < objects.length; i = i + 1 ) {
        if ( objects[i].id === id ) {
            return objects[i];
        }
    }
    return null;
}
Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (var i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};
