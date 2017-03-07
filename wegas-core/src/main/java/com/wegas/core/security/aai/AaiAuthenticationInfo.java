package com.wegas.core.security.aai;

/**
 * Created by jarle.hulaas@heig-vd.ch on 07.03.2017.
 */
public class AaiAuthenticationInfo {

    private String homeOrg;
    private String persistentID;

    public AaiAuthenticationInfo(){

    }

    public String getHomeOrg(){
        return homeOrg;
    }

    public void setHomeOrg(String homeOrg){
        this.homeOrg = homeOrg;
    }

    public String getPersistentID(){
        return persistentID;
    }

    public void setPersistentID(String persistentID){
        this.persistentID = persistentID;
    }
}
