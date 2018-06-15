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
public class Searchboxs {

    private String id;
    private String title;
    private String type;
    private List<Data> data;
    @JsonProperty("isShowAll")
    private String isshowall;
    public void setId(String id) {
         this.id = id;
     }
     public String getId() {
         return id;
     }

    public void setTitle(String title) {
         this.title = title;
     }
     public String getTitle() {
         return title;
     }

    public void setType(String type) {
         this.type = type;
     }
     public String getType() {
         return type;
     }

    public void setData(List<Data> data) {
         this.data = data;
     }
     public List<Data> getData() {
         return data;
     }

    public void setIsshowall(String isshowall) {
         this.isshowall = isshowall;
     }
     public String getIsshowall() {
         return isshowall;
     }

}