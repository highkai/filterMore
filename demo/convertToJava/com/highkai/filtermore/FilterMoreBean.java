/**
  * Copyright 2018 aTool.org 
  */
package com.highkai.filtermore;
import java.util.List;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonProperty;
/**
 * Auto-generated: 2018-06-15 14:45:49
 *
 * @author aTool.org (i@aTool.org)
 * @website http://www.atool.org/json2javabean.php
 */
public class FilterMoreBean {

    @JsonProperty("expandRow")
    private int expandrow;
    @JsonProperty("isCascade")
    private boolean iscascade;
    @JsonProperty("searchBoxs")
    private List<Searchboxs> searchboxs;
    public void setExpandrow(int expandrow) {
         this.expandrow = expandrow;
     }
     public int getExpandrow() {
         return expandrow;
     }

    public void setIscascade(boolean iscascade) {
         this.iscascade = iscascade;
     }
     public boolean getIscascade() {
         return iscascade;
     }

    public void setSearchboxs(List<Searchboxs> searchboxs) {
         this.searchboxs = searchboxs;
     }
     public List<Searchboxs> getSearchboxs() {
         return searchboxs;
     }

}