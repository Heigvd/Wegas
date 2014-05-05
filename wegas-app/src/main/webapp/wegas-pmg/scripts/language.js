var msg_fr = {
    endTaskNextFrom: "%employeeName%",
    endTaskNextSubject: "(%step%) Fin de la t�che : %task%",
    endTaskNextContent: 'La t�che "%task%" est termin�e, je passe � la t�che %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    endTaskNormalFrom: "%employeeName%",
    endTaskNormalSubject: "(%step%) Fin de la t�che : %task%",
    endTaskNormalContent: 'La t�che "%task%" est termin�e. Je retourne � mes activit�s traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%',

    predTaskFrom: "%employeeName%",
    predTaskSubject: "(%step%) Impossible de progresser sur la t�che : %task%",
    presTaskContent: 'Je suis sens� travailler sur la t�che "%task%" mais les t�ches pr�cedentes ne sont pas assez avanc�es. <br/> Je retourne donc � mes occupations habituel. <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    partFinTaskFrom: "%employeeName%",
    partFinTaskSubject: "(%step%) T�che : %task% en partie termin�e",
    partFinTaskContent: 'Nous avons termin� la partie %work% de la t�che %task%. <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    qualifTaskFrom: "%employeeName%",
    qualifTaskSubject: "(%step%) Impossible de progresser sur la t�che : %task%",
    qualifTaskContent: 'Je suis cens� travailler sur la t�che %task% mais je ne suis pas qualifi� pour ce travail. <br/> Salutations <br/>%employeeName%<br/> %job%'

};

function getString(string, object) {
    var key;
    for (key in object) {
        if(object.hasOwnProperty(key)){
            string = string.replace("%" + key + "%", object[key]);
        }
    }
    return string;
}