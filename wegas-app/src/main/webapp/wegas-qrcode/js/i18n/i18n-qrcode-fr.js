/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author jarle hulaas
 */
/*qrcode Variable, gameModel, self */

YUI.add("wegas-i18n-qrcode-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-qrcode", "fr", {
        qrcode: {
            noCamera: "Aucune caméra trouvée",
            startScan: "Scanner un QR-code",
            cancelScan: "Annuler le scan",
            mirror: "Inverser l'image",
            accessRights: "Pour pouvoir scanner, il faut donner au navigateur ET à ce site web le droit d'accéder à la caméra",
            notUnderstood: "QR-code incompréhensible !<br/>A-t-il vraiment été créé pour ce jeu ?",
        },
    });
});
