YUI.add("lang/inputex_ca", function(Y) {

    Y.Intl.add(

    "inputex", // associated module
    "ca", // BCP 47 language tag
    {

        required: "Aquest camp �s obligatori",
        invalid: "Aquest camp no �s obligatori",
        valid: "Aquest camp �s v�lid",

        invalidEmail: "Correu electr�nic no v�lid, ex:nom@correu.cat",
        selectColor: "Seleccioni un color:",
        invalidPassword: ["La contrasenya ha de tenir almenys", "n�meros o lletres"],
        invalidPasswordConfirmation: "Les contrasenyes s�n diferents!",
        passwordStrength: "La contrasenya �s massa senzilla",
        capslockWarning: "Atenci�: bloqueig de maj�scules activat",
        invalidDate: "Data no v�lida, ej: 25/01/2007",
        defaultDateFormat: "d/m/Y",
        shortMonths: ["Gen", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dec"],
        months: ["Gener", "Febrer", "Mar�", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Decembre"],
        weekdays1char: ["G", "L", "T", "X", "J", "V", "S"],
        shortWeekdays: ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"],
        selectMonth: "- Seleccioni un mes -",
        dayTypeInvite: "Dia",
        monthTypeInvite: "Mes",
        yearTypeInvite: "Any",
        cancelEditor: "Cancel�la",
        okEditor: "D'acord",
        defaultCalendarOpts: {
            navigator: {
                strings: {
                    month: "Seleccioni un mes",
                    year: "Introdueixi un any",
                    submit: "D'acord",
                    cancel: "Cancel�la",
                    invalidYear: "Any no v�lid"
                }
            },
            start_weekday: 1
            // la setmana comen�a el Dilluns
        },
        stringTooShort: ["Aquest camp ha de tenir, almenys, ", " car�cters (lletres o n�meros)"],
        stringTooLong: ["Aquest camp ha de tenir, com a molt, ", " car�cters (lletres o n�meros)"],
        ajaxWait: "Enviant...",
        menuTypeInvite: "Fes clic aqu� per seleccionar",

        // List
        listAddLink: "Afegir",
        listRemoveLink: "Eliminar",


        // Datatable
        saveText: "Desa",
        cancelText: "Cancel�la",
        modifyText: "Modifica",
        deleteText: "Elimina",
        insertItemText: "Insereix",
        confirmDeletion: "Est� segur que vol esborrar?",


        // TimeInterval
        timeUnits: {
            SECOND: "segons",
            MINUTE: "minuts",
            HOUR: "hores",
            DAY: "dies",
            MONTH: "mesos",
            YEAR: "anys"
        }

    });

    Y.inputEx.messages = Y.Intl.get("inputex");

},
'3.1.0', {
    requires: ['inputex']
});
