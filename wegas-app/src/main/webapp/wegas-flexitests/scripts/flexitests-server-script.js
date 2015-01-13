/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
function store(object, key, value){
    object.properties.put(key, value);   
}

function getInstances(descriptors){
    var a=[], i;
    if(com.wegas.core.security.util.SecurityHelper.isPermitted(self.getGame(), "Edit")){
        for(i in descriptors){
            a.push(Variable.find(self.getGameModel(), descriptors[i]).getScope().getVariableInstances());
        }
    }else{
        for(i in descriptors){
            a.push(Variable.find(self.getGameModel(), descriptors[i]).getScope().getPrivateInstances());
        }
    }
    
    return a;
}