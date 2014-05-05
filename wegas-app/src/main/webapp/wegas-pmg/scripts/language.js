var msg_fr = {
    endTaskNextFrom: "%employeeName%",
    endTaskNextSubject: "(%step%) Fin de la tâche : %task%",
    endTaskNextContent: 'La tâche "%task%" est terminée, je passe à la tâche %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    endTaskNormalFrom: "%employeeName%",
    endTaskNormalSubject: "(%step%) Fin de la tâche : %task%",
    endTaskNormalContent: 'La tâche "%task%" est terminée. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%',

    predTaskFrom: "%employeeName%",
    predTaskSubject: "(%step%) Impossible de progresser sur la tâche : %task%",
    presTaskContent: 'Je suis sensé travailler sur la tâche "%task%" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituel. <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    partFinTaskFrom: "%employeeName%",
    partFinTaskSubject: "(%step%) Tâche : %task% en partie terminée",
    partFinTaskContent: 'Nous avons terminé la partie %work% de la tâche %task%. <br/> Salutations <br/>%employeeName%<br/> %job%',
    
    qualifTaskFrom: "%employeeName%",
    qualifTaskSubject: "(%step%) Impossible de progresser sur la tâche : %task%",
    qualifTaskContent: 'Je suis censé travailler sur la tâche %task% mais je ne suis pas qualifié pour ce travail. <br/> Salutations <br/>%employeeName%<br/> %job%'

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