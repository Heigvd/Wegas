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

YUI.add("wegas-i18n-qrcode-en", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-qrcode", "en", {
        qrcode: {
            noCamera: "No camera found",
            startScan: "Scan a QR-code",
            cancelScan: "Cancel the scan",
            mirror: "Flip image",
            accessRights: "In order to enable scanning, please allow the browser AND this website to access the camera",
            notUnderstood: "Incomprehensible QR-code !<br/>Was it really created for this game ?",
        },
    });
});
