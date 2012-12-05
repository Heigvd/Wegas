var ret = [], cObject, level;

function resetActions() {
    for (var i = 0; i < level.objects.length; i++) {
        level.objects[i].actions = level.objects[i].defaultActions;
        sendCommand({
            type: "updated",
            object: level.objects[i].clone()
        });
    }
}
function run(playerFn, lvl) {
    var i;
    level = lvl;

    for (i = 0; i < level.objects.length; i++) {
        println("mmm"+ level.objects[i].actions);
        level.objects[i].defaultActions = level.objects[i].actions;
    }

    for (i = 0; i < level.maxTurns; i++) {
        sendCommand({
            type:'log',
            'text': 'Turn ' + (i + 1)
        });

        resetActions();

        cObject = 'Player';
        sendCommand({
            type:'log',
            'text': 'Player turn.'
        });
        playerFn();

        if (level.ai) {
            cObject='Enemy';
            sendCommand({
                type:'log',
                'text': 'Enemy turn.'
            });
            eval(level.ai);
        }
    }
    sendCommand({
        type:'log',
        'text': 'It\'s lost.'
    });

    //"sendCommand({type:'resetLevel', objects: " + Y.JSON.stringify(this.get("objects")) + "});"
    return ret;
}

function sendCommand (cfg) {
    if (!checkGameOver()) {
        ret.push(cfg);
    }
}
function log(text) {
    ret.push({
        type: 'log',
        text: text
    });
}
function checkActions(object, actions) {
    return object.actions - actions >= 0;
}
function consumeActions(object, actions) {
    if (object.actions - actions < 0) {
        //log("Not enough actions");
        return false;
    }
    object.actions -= actions;
    return true;
}

function move() {
    var object = findObject(cObject);

    if (!consumeActions(object, 1)) {
        log("Not enough actions to move.");
        return;
    }

    switch (object.direction) {
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
function rotate(dir) {
    var object = findObject(cObject);
    if (!consumeActions(object, 1)) {
        log("Not enough actions to rotate.");
        return;
    }
    object.direction += dir;
    if (object.direction > 4) object.direction = 1;
    if (object.direction < 1) object.direction = 4;
    sendMoveCommand();
}
function rotateRight() {
    rotate(1);
}
function rotateLeft() {
    rotate(-1);
}

function sendMoveCommand() {
    var object = findObject(cObject);
    sendCommand({
        type: 'move',
        object: object.clone()
    });
}

function fire() {
    var i, source = findObject(cObject);
    println("fire" + source.actions);

    if (!consumeActions(source, 1)) {
        log("Not enough actions to fire.");
        return;
    }

    sendCommand({
        type: 'fire',
        object: source.clone()
    });

    switch (source.direction) {
        case 1:
            for (i=0; i <= source.range; i++) {
                checkCollision(cObject, source.x, source.y + i);
            }
            break;
        case 2:
            for (i=0; i <= source.range; i++) {
                checkCollision(cObject, source.x + i, source.y);
            }
            break;
        case 3:
            for (i=0; i <= source.range; i++) {
                checkCollision(cObject, source.x, source.y - i);
            }
            break;
        case 4:
            for (i=0; i <= source.range; i++) {
                checkCollision(cObject, source.x - i, source.y);
            }
            break;
    }
}
function checkCollision(sourceId, x, y) {
    var objects = level.objects;
    for (var k=0; k < objects.length; k++) {
        if (objects[k].x === x && objects[k].y === y && objects[k].id !== sourceId) {
            objects[k].life = 0;
            sendCommand({
                type: 'die',
                object: objects[k].id
            });
        }
    }
}

function checkWinningCondition() {
    return eval(level.winningCondition);
}
var gameOverSent = false;
function checkGameOver() {
    if (gameOverSent) {
        return true;
    }
    if (eval(level.winningCondition)) {
        gameOverSent = true;
        ret.push({
            type: "log",
            text: "You won!"
        });
        ret.push({
            type: "gameWon"
        });
        return true;
    }
    return false;
}
function findObject(id){
    var objects = level.objects;
    for (var i = 0; i < objects.length; i = i + 1) {
        if (objects[i].id === id) {
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
    }
    return newObj;
};
