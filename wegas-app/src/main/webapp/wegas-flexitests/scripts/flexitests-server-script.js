
function store(object, key, value){
    object.properties.put(key, value);   
}

function getInstances(descriptors){
    var a=[], i;
    if(com.wegas.core.security.util.SecurityHelper.isPermitted(self.getGame(), "Edit")){
        for(i in descriptors){
            a.push(VariableDescriptorFacade.find(self.getGameModel(), descriptors[i]).getScope().getVariableInstances());
        }
    }else{
        for(i in descriptors){
            a.push(VariableDescriptorFacade.find(self.getGameModel(), descriptors[i]).getScope().getPrivateInstances());
        }
    }
    
    return a;
}