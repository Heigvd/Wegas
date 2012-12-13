YUI.add("lang/inputex_es", function(Y) {

    Y.Intl.add(

    "inputex", // associated module
    "es", // BCP 47 language tag
    {
        required: "Este campo es obligatorio",
        invalid: "Este campo no es v�lido",
        valid: "Este campo es v�lido",

        invalidEmail: "Correo electr�nico no v�lido, ej: tu.nombre@correo.es",
        selectColor: "Selecciona un color:",
        invalidPassword: ["La contrase�a debe contener al menos ", "numeros o letras"],
        invalidPasswordConfirmation: "las contrase�as son diferentes!",
        passwordStrength: "La contrase�a es demasiado d�bil",
        capslockWarning: "Atenci�n: bloqueo de may�sculas activado",
        invalidDate: "Fecha no v�lida, ej: 25/01/2007",
        defaultDateFormat: "d/m/Y",
        shortMonths: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        weekdays1char: ["D", "L", "M", "X", "J", "V", "S"],
        shortWeekdays: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
        selectMonth: "- Seleccione un mes -",
        dayTypeInvite: "D�a",
        monthTypeInvite: "Mes",
        yearTypeInvite: "A�o",
        cancelEditor: "Cancelar",
        okEditor: "Aceptar",
        defaultCalendarOpts: {
            navigator: {
                strings: {
                    month: "Seleccione un mes",
                    year: "Introduzca un a�o",
                    submit: "Aceptar",
                    cancel: "Cancelar",
                    invalidYear: "A�o no v�lido"
                }
            },
            start_weekday: 1
            // la semaine commence un lundi
        },
        stringTooShort: ["Este campo debe contener al menos ", " caracteres (letras o n�meros)"],
        stringTooLong: ["Este campo debe contener como mucho ", " caracteres (letras o n�meros)"],
        ajaxWait: "Enviando...",
        menuTypeInvite: "Haga click aqu� para seleccionar",

        // List
        listAddLink: "A�adir",
        listRemoveLink: "Eliminar",


        // Datatable
        saveText: "Salvar",
        cancelText: "Cancelar",
        modifyText: "Modificar",
        deleteText: "Eliminar",
        insertItemText: "Insertar",
        confirmDeletion: "�Est� seguro que desea borrar?",


        // TimeInterval
        timeUnits: {
            SECOND: "segundos",
            MINUTE: "minutos",
            HOUR: "horas",
            DAY: "d�as",
            MONTH: "meses",
            YEAR: "a�os"
        }


    });

    Y.inputEx.messages = Y.Intl.get("inputex");

},
'3.1.0', {
    requires: ['inputex']
});
