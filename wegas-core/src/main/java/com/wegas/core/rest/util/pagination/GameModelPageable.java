package com.wegas.core.rest.util.pagination;

import java.util.ArrayList;

public class GameModelPageable extends GamePageable{

    private ArrayList<String> permissions;

    public GameModelPageable() {
        // ensure default constructor
    }

    public GameModelPageable(int page, int size, String query, boolean mine, ArrayList<String> permissions) {
        super(page, size,query, mine);
        this.permissions = permissions;
    }

    public ArrayList<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(ArrayList<String> permissions) {
        this.permissions = permissions;
    }
}
