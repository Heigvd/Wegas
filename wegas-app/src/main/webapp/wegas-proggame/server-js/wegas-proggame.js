var ret = [], cObject, level;

function resetActions () {
    for (var i = 0; i < level.objects.length; i++) {
        level.objects[i].actions = level.objects[i].defaultActions;
        sendCommand({
            type: "updated",
            object: level.objects[i].clone()
        });
    }
}
function run (playerFn, lvl) {
    var i;
    level = lvl;

    //"sendCommand({type:'resetLevel', objects: " + Y.JSON.stringify(this.get("objects")) + "});"

    for (i = 0; i < level.objects.length; i += 1) {
        level.objects[i].defaultActions = level.objects[i].actions;
    }

    if (level.onStart) {
        eval(level.onStart);
    }

    for (i = 0; i < level.maxTurns; i += 1) {

        log('Turn ' + (i + 1));

        for (j = 0; j < level.objects.length; j += 1) {

            if (checkGameOver()) continue;

            o = level.objects[j];
            if (o.ai) {
                log(o.id + ' turn');
                cObject = o.id;
                eval(o.ai);
            }
            if (o.id === "Player") {
                log('Player turn');
                cObject = 'Player';
                playerFn.apply(this, values(getArgs()));
            }
        }

        resetActions();
    }
    if (!checkGameOver()) {
        log('It\'s lost.');
    }

    return ret;
}

function sendCommand(cfg) {
    ret.push(cfg);
}
function log (text) {
    ret.push({
        type: 'log',
        text: text
    });
}
var args = {};
function pushArg(name, val) {
    args[name] = val;
}
function getArgs() {
    return args;
}
function consumeActions(object, actions) {
    if (object.actions - actions < 0) {
        //log("Not enough actions");
        return false;
    }
    object.actions -= actions;
    return true;
}
var said = "";
function say(msg) {
    var object = findObject(cObject);

    if (checkGameOver()) return;

    /*if (!consumeActions(object, 1)) {
        log("Not enough actions to say something");
        return;
    }*/

    log(object.id + " says \"" + msg + "\"" );
    said = msg;
}

function move() {
    var object = findObject(cObject),
    moveV = dirToVector(object.direction);

    if (checkGameOver()) return;

    if (!consumeActions(object, 1)) {
        log("Not enough actions to move");
        return;
    }

    if (checkCollision(cObject, object.x + moveV.x, object.y + moveV.y)) {
        log("Something is blocking the way");
    } else {
        object.x += moveV.x;
        object.y += moveV.y;
        sendCommand({
            type: 'move',
            object: object.clone()
        });
    }

}
function rotate (dir) {
    var object = findObject(cObject);

    if (checkGameOver()) return;

    if (!consumeActions(object, 1)) {
        log("Not enough actions to rotate.");
        return;
    }
    object.direction += dir;
    if (object.direction > 4) object.direction = 1;
    if (object.direction < 1) object.direction = 4;
    sendCommand({
        type: 'move',
        object: object.clone()
    });
}
function right () {
    rotate(1);
}
function left () {
    rotate(-1);
}

function fire () {
    var i, source = findObject(cObject);
    println("fire" + source.actions);

    if (checkGameOver()) return;

    if (!consumeActions(source, 1)) {
        log("Not enough actions to fire.");
        return;
    }

    sendCommand({
        type: 'fire',
        object: source.clone()
    });

    var colidee, dirV = dirToVector(source.direction);

    for (i = 0; i <= source.range; i++) {
        colidee = checkCollision(cObject, source.x + (i * dirV.x), source.y + (i * dirV.y));
        if (colidee) {
            colidee.life = 0;
            sendCommand({
                type: 'die',
                object: colidee.clone()
            });
        }
    }
}

function checkCollision(sourceId, x, y) {
    var o, k, objects = level.objects;
    for (k=0; k < objects.length; k++) {
        o = objects[k];
        if (o.x === x && o.y === y && o.id !== sourceId &&
            (o.collides === undefined || o.collides)) {
            return objects[k];
        }
    }
    return null;
}

var gameOverSent = false;
function checkGameOver (cfg) {
    if (gameOverSent) {
        return true;
    } else if (eval(level.winningCondition)) {
        gameOverSent = true;
        log("You won!");
        ret.push({
            type: "gameWon"
        });
        return true;
    }
    return false;
}
function findObject (id) {
    var objects = level.objects;
    for (var i = 0; i < objects.length; i = i + 1) {
        if (objects[i].id === id) {
            return objects[i];
        }
    }
    return null;
}
Object.prototype.clone = function () {
    var newObj = (this instanceof Array) ? [] : {};
    for (var i in this) {
        if (i == 'clone')
            continue;
        if (this[i] && typeof this[i] == "object") {
            newObj[i] = this[i].clone();
        } else
            newObj[i] = this[i]
    }
    return newObj;
};
// *** Utilities *** //
function dirToVector(dir) {
    var dirX = 0, dirY = 0;
    switch (dir) {
        case 1:
            dirY = 1;
            break;
        case 2:
            dirX = 1;
            break;
        case 3:
            dirY = -1;
            break;
        case 4:
            dirX = -1;
            break;
    }
    return {
        x: dirX,
        y: dirY
    };
}
function values(object) {
    var ret = [], i;
    for (i in object) {
        ret.push(object[i]);
    }
    return ret;
}
