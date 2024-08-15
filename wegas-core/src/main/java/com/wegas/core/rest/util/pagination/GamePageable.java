package com.wegas.core.rest.util.pagination;

public class GamePageable extends Pageable{

    private boolean mine;

    public GamePageable() {
        // ensure default constructor
    }

    public GamePageable(int page, int size, String query, boolean mine) {
        super(page, size, query);
        this.mine = mine;
    }

    public boolean getMine() {
        return mine;
    }

    public void setMine(boolean mine) {
        this.mine = mine;
    }
}
