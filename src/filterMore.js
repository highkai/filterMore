/*
 * 功能：    拓展String类型方法，添加常用功能
 * 创建人：  焰尾迭
 * 创建时间：2015-11-18
 */
$.extend(String.prototype, {
    /*
     * 功能：    类似C# String.Format()格式化功能
     * 参数：    args：参数
     * 返回值：  无
     */
    format: function (args) {
        var result = this;
        if (arguments.length > 0) {
            if (arguments.length == 1 && typeof (args) == "object") {
                for (var key in args) {
                    if (args[key] != undefined) {
                        var reg = new RegExp("({" + key + "})", "g");
                        result = result.replace(reg, args[key]);
                    }
                }
            }
            else {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] != undefined) {
                        //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出

                        var reg = new RegExp("({)" + i + "(})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
        }
        return result;
    }
});

/*!
 @Name：fiterMore v1.0 互联网风格筛选条件插件
 @Author：焰尾迭
 @Site：http://yanwei.cnblogs.com
 @github: http://aui.github.com/fiterMore
 @License：LGPL
 */
(function ($) {
    $.fn.extend({
        /*
         * 功能：    互联网风格筛选条件插件
         * 参数：    options：{
                             "search":  function (paramList) {}, //查询事件,回调函数参数paramList为筛选条件
                             "searchOnSelect": false,  //点击选项时是否触发查询，默认为true
                             "expandRow": 2,  //展开条件数 默认为2
                             "expandEvent": function (state) {},//展开更多条件触发事件 参数：state  true表示展开  false 收缩
                             //筛选条件项
                             "searchBoxs": [
                             {
                                 "id": "xx",
                                 "isMultiple": false, //是否多选
                                 "type": "datetime",   //存在自定义日期区间时需设定  值可为 datetime(带时分秒) | date
                                 "title": "时间范围",
                                 "valueField":"value", //选项json 键字段名称 默认为value
                                 "textField":"text",   //选项json 值字段名称 默认为text
                                 "data": [{value:1,text:'语文'},{value:2,text:'数学'}],  //选项数据
                                 "fullData":[{value:1,text:'语文',parentId:2},{value:2,text:'数学',parentId:3}],//全部选项
                                 "isShowAll": false,//是否显示全部
                                 "defaults": ['0'], //默认选中值，没有则选中全部
                                 //自定义
                                 "custom": {
                                     "isRange": true, //是否区间 默认为true
                                     'event': function (start, end) { }
                                 },
                                 "parentId":"cascadedControlId",//级联控件ID，一般是上级控件
                             }]
                         }
         * 返回值：  无
         * 创建人：  焰尾迭
         * 创建时间：2015-12-21
         */
        fiterMore: function (options) {
            //展开收缩有回调事件时，默认最大展示条数
            var MAX_SHOW_COUNT = 10;
            //id前缀
            var ID_STUFF = "searchitem_";

            var searchCtl = this;
            var filterBtn = $('<div class="filter_btn"><span class="expand">展开条件</span></div>');

            var defaults = {
                //展开更多条件回调事件
                //参数：state  true表示展开  false 收缩
                "expandEvent": function (state) {
                },
                //默认展开条件数
                "expandRow": 2,
                //查询框
                "searchBoxs": [],
                //查询事件
                "search": function (paramList) {
                },
                //参数收集时返回值的Key
                "paramkey": "ValueList",
                //参数收集时自定义条件返回值的Key
                "paramCustomkey": "CustomList",
                //点击选项时是否立即进行查询 默认为true
                "searchOnSelect": true,
                //================↓↓↓高级选项↓↓↓================
                //是否级联：默认为false,即每个选项之间不起级联绑定作用；为true时，设置了parentId的被关联控件的选项会相应变化。
                "isCascade": false,
                //================下面这三个参数是控制是否传列表数据到前端进行反向过滤的【暂时先设计在这儿，代码中没有实现这个逻辑】================
                //是否被数据反选条件：仅用于查询结果数据源总量非常少的时候（实现购物网站的sku缺货效果，这种情况下的结果排列组合非常少）
                //	默认为false，即条件单向过滤数据；
                //	为true时，需要同时从后台返回结果数据到前台，并将受影响的过滤条件的字段全部包含。
                //		1、每次条件变化时，根据已选条件，过滤出数据
                //		2、根据过滤出的数据，disable掉没有匹配结果的选项（即购物网站上的缺货sku变灰效果）            	
                "isAffectedBySkuResult": false,
                //待选结果集：用来反选上面选项的数据项
                "skuResults": [],
                //已选结果集：通过过滤选项已经过滤好的结果集
                "selectedSkuResults": []
                //================上面这三个参数是控制是否传列表数据到前端进行反向过滤的【暂时先设计在这儿，代码中没有实现这个逻辑】================
                //================↑↑↑高级选项↑↑↑================
            };

            //查询控件参数
            var settings = $.extend(defaults, options);

            //处理数据
            if (isNaN(settings.expandRow) || settings.expandRow < 1) {
                settings.expandRow = 2;//默认展开两行得了，报啥错
                console.log("默认展开条件数'expandRow'必须为大于0的整数,不过程序已经智能地改成两行了。");
                //throw Error("默认展开条件数'expandRow'必须为大于0的整数");
            } else {
                if (settings.expandRow > settings.searchBoxs.length) {
                    settings.expandRow = settings.searchBoxs.length;
                }
            }
            //默认展开高度 每行高度40 - 下边框高度1
            var _expandHeight = settings.expandRow * 40 - (settings.expandRow - 1) * 1;
            searchCtl.css({ 'height': _expandHeight });

            $(settings.searchBoxs).each(function (i, item) {
                //1.id处理
                if (item.id && typeof (item.id) == "string") {
                    item.srcID = item.id;
                    item.id = "{0}{1}".format(ID_STUFF, item.id);
                } else {
                    item.srcID = i;
                    item.id = "{0}{1}".format(ID_STUFF, i);
                }


                //2.值域 文本域 绑定字段
                if (item.valueField || item.textField) {
                    if (item.valueField && !item.textField) {
                        item.textField = item.valueField;
                    }

                    if (item.textField && !item.valueField) {
                        item.valueField = item.textField;
                    }
                } else {
                    item.valueField = "value";
                    item.textField = "text";
                }

                //3.默认值处理
                if (!item.defaults) {
                    item.defaults = [];
                }

                item.selected = [];
                for (var j = 0; j < item.defaults.length; j++) {
                    item.selected.push(item.defaults[j]);
                }
                item.customSelectd = [];

                //4.是否多选处理,默认为单选
                if (item.isMultiple == undefined || item.isMultiple.toLowerCase() == "false") {
                    item.isMultiple = false;
                }

                //5.是否显示全部选项
                if (item.isShowAll == undefined || item.isShowAll.toLowerCase()=="true" ) {
                    item.isShowAll = true;
                }
            });


            //生成查询控件HTML
            _createCtrl();


            ////////////////////////////////////////事件绑定////////////////////////////////////////

            //给选项添加了自定义事件 select 对外调用
            searchCtl.on("click select", ".filter_option span", function (e) {
                var item = _getItem(this);
                var itemId = _getItemId(this);
                var index = $(this).attr("data-id");
                //当前操作状态 
                //  select              :当前元素选中 
                //  cancel              :当前元素取消选中 
                //  cancelall           :全部  
                //  selectremove        :当前元素选中,其它元素移除选中 单选
                var state = "select";

                if (item.isMultiple == false || $(this).hasClass("option_all")) {
                    //单选 【将点击标签设置已选中，同时反选其他标签】
                    $(this).addClass("selected").siblings("span").removeClass("selected");

                    item.selected = [];
                    if (!$(this).hasClass("option_all")) {
                        item.selected.push(item.data[index][item.valueField]);
                        state = "selectremove";
                    } else {
                        state = "cancelall";
                    }
                } else {
                    //多选

                    //当前已经选中,则取消选中
                    if ($(this).hasClass("selected")) {
                        $(this).removeClass("selected");
                        state = "cancel";
                        //删除元素,寻找要删除的元素在数组的位置
                        var val = item.data[index][item.valueField];
                        for (var i = 0, length = item.selected.length; i < length; i++) {
                            if (item.selected[i] == val) {
                                item.selected.splice(i, 1);
                            }
                        }

                        if (item.selected.length == 0) {
                            $(this).siblings(".option_all").addClass("selected");
                            state = "cancelall";
                        }
                    } else {
                        $(this).addClass("selected");
                        $(this).siblings(".option_all").removeClass("selected");
                        item.selected.push(item.data[index][item.valueField]);
                        state = "select";
                    }
                }

                //清空自定义查询默认值
                _clearCustomValue(item);

                //选择项触发回调事件
                if (typeof (item.onSelect) == "function" && e.type == "click") {
                    item.onSelect(item.data[index], state);
                }

                //如果允许级联条件，则需要选择该控件的级联子控件。
                if (settings.isCascade) {
                    var subControls = [];
                    for (var i = 0, length = settings.searchBoxs.length; i < length; i++) {
                        if (!!settings.searchBoxs[i].parentId && settings.searchBoxs[i].parentId.indexOf('|' + itemId + '|') >= 0) {
                            subControls.push(settings.searchBoxs[i]);
                        }
                    }
                    filterSubControls(subControls);
                    //rebindSubControls(subControls, itemId, item.selected);
                }



                //触发查询事件
                if (typeof (settings.search) == "function" && settings.searchOnSelect) {
                    settings.search(_getParamList());
                }
            })

            //收缩展开监听事件
            searchCtl.on("click", ".r", function (e, data) {
                _itemExpand(e, this, data);
            });

            //更多条件展开收缩
            filterBtn.find('span').on("click", function () {
                var state = true;
                if ($(this).hasClass('expand')) {
                    $(this).text('收缩条件').removeClass('expand');
                    searchCtl.css({ 'height': 'auto' });
                } else {
                    $(this).text('展开条件').addClass('expand');
                    searchCtl.css({ 'height': _expandHeight });
                    state = false;
                }
                if (typeof (settings.expandEvent) == "function") {
                    settings.expandEvent(state);
                }
            });

            //自定义条件确定按钮点击事件
            searchCtl.on("click", '.filter_custom .btn_filter_sure', function () {
                var index = $(this).attr("data-id");
                var item = settings.searchBoxs[index];

                var start = $("#{0}_c_custom_start".format(item.id)).val();

                var end;
                if (item.custom.isRange) {
                    end = $("#{0}_c_custom_end".format(item.id)).val();
                }

                //自定义条件搜索按钮点击触发回调事件,用于用于校验输入数据是否正确
                if (typeof (item.custom.event) == "function") {
                    if (!item.custom.event(start, end)) {
                        return;
                    }
                }
                //清空当前项其它选择条件
                $(this).closest(".filter_custom").siblings('.filter_option').find('span').removeClass('selected');
                item.selected = [];


                item.customSelectd[0] = start;

                if (item.custom.isRange) {
                    item.customSelectd[1] = end;
                }

                //触发查询事件
                if (typeof (settings.search) == "function") {
                    settings.search(_getParamList());
                }
            });

            function filterSubControls(subControls) {
                //下面循环用来依次重新生成受影响的子控件
                for (var i = 0; i < subControls.length; i++) {
                    var subCtl = subControls[i];
                    subCtl.data = subCtl.fullData.concat();//清除子控件已选条件列表               
                    for (var l = 0; l < settings.searchBoxs.length; l++) {
                        var parentCtrl = settings.searchBoxs[l];
                        if (parentCtrl.id != subCtl.id) {
                            var itemId = parentCtrl.id.replace("searchitem_", "");
                            var selectedParentIds = parentCtrl.selected;
                            if (!!selectedParentIds && selectedParentIds.length > 0) {
                                console.log(itemId + ' ' + selectedParentIds);
                                for (var k = 0; k < subCtl.data.length; k++) {
                                    console.log("subCtl Parentid " + subCtl.data[k][itemId]);
                                    if (!!subCtl.data[k][itemId]) {
                                        if ($.inArray(subCtl.data[k][itemId], selectedParentIds) < 0) {
                                            console.log(subCtl.data[k]);
                                            subCtl.data.splice(k, 1);
                                            k = k - 1;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //重新创建关联子控件
                    _reCreateCtrl(subCtl);
                }
            }

            /**
             * [rebindSubControls 重新绑定子控件]
             * @param  {[子控件数组]} subControls       [子控件集合（可能一个控件改变会改变几个控件）]
             * @param  {[父控件ID]} itemId            [当前改变的控件ID]
             * @param  {[父控件已选条件值]} selectedParentIds [当前点击的控件已经选择的值（因为可能是多选）]
             * @return {[type]}                   [无]
             */
            function rebindSubControls(subControls, itemId, selectedParentIds) {
                //下面循环用来依次重新生成受影响的子控件
                for (var i = 0; i < subControls.length; i++) {
                    var subCtl = subControls[i];
                    subCtl.data = [];//清除子控件已选条件列表               
                    //下面循环依次将父控件的已选条件值代入到子控件所有可选值【fullData，比如全国所有城市】中进行匹配，将能够匹配的值作为子控件的选项列表【data，比如选中的几个省（如江苏、浙江等）的城市】。
                    for (var j = 0; j < selectedParentIds.length; j++) {
                        var parentId = selectedParentIds[j];
                        for (var k = 0; k < subCtl.fullData.length; k++) {
                            if (!!subCtl.fullData[k][itemId] && subCtl.fullData[k][itemId] == parentId) {
                                subCtl.data.push(subCtl.fullData[k]);
                            }
                        }
                    }

                    //重新创建关联子控件
                    _reCreateCtrl(subCtl);
                }
            }


            /**
             *   [_reCreateCtrl 重画控件]
             * @param  {[searchBox对象]} item [用来指导程序怎么生成一个searchBox]
             * @return {[void]}      [无]
             */
            function _reCreateCtrl(item) {
                var strHTML = "";
                $(settings.searchBoxs).each(function (i, itemi) {
                    if (itemi.id == item.id) {
                        strHTML += ('<div class="searchbox-item" {0} data-id="{1}" id="{2}">'.format((i + 1) == settings.searchBoxs.length ? 'style="border: 0"' : "", i, item.id) +
                            '<div class="l" id="{1}_l">{0}<i></i></div>'.format(item.title, item.id) +
                            '<div class="c" id="{0}_c">'.format(item.id) +
                            '<div class="control-type">({0})</div><div class="filter_option" style="padding-right:{1}px;">'.format(item.isMultiple ? "多选" : "单选", _getCustomDivWidth(item) + 20) + _createOptions(item) +
                            '</div>' + _createCustomFilter(i, item) +
                            '</div>' +
                            '<a href="javascript:;" class="r" id="{0}_r"><span class="text">展开</span></a>'.format(item.id) +
                            '</div>');
                    }
                });
                $("#" + item.id).replaceWith(strHTML);
                //同时需要清除原来这个条件的已选项。
                item.selected = [];
                //清空自定义查询默认值
                _clearCustomValue(item);
                $(".searchbox .searchbox-item").each(function (i) {
                    var height = $(this).find(".filter_option").outerHeight();
                    if (height <= 30) {
                        $(this).find(".r").remove();
                    }
                });
            }

            ////////////////////////////////////////私有方法////////////////////////////////////////
            /*
             * 功能：    根据数据初始化查询控件
             * 参数：    当前项元素
             * 返回值：  当前项数据
             * 创建人：  杜冬军
             * 创建时间：2015-12-21
             */
            function _createCtrl() {
                var strHTML = "";

                $(settings.searchBoxs).each(function (i, item) {
                    strHTML += ('<div class="searchbox-item" {0} data-id="{1}" id="{2}">'.format((i + 1) == settings.searchBoxs.length ? 'style="border: 0"' : "", i, item.id) +
                        '<div class="l" id="{1}_l">{0}<i></i></div>'.format(item.title, item.id) +
                        '<div class="c" id="{0}_c">'.format(item.id) +
                        '<div class="control-type">({0})</div><div class="filter_option" style="padding-right:{1}px;">'.format(item.isMultiple ? "多选" : "单选", _getCustomDivWidth(item) + 20) + _createOptions(item) +
                        '</div>' + _createCustomFilter(i, item) +
                        '</div>' +
                        '<a href="javascript:;" class="r" id="{0}_r"><span class="text">展开</span></a>'.format(item.id) +
                        '</div>');
                });

                searchCtl.html(strHTML);
                $(".searchbox .searchbox-item").each(function (i) {
                    var height = $(this).find(".filter_option").outerHeight();
                    if (height <= 30) {
                        $(this).find(".r").remove();
                    }
                });
                //如果默认展开行数小于总条数,则将搜索条件之后放置【展开条件】按钮
                if (settings.expandRow < settings.searchBoxs.length) {
                    searchCtl.after(filterBtn);
                }
            }

            //获取自定义查询框宽度
            function _getCustomDivWidth(item) {
                if (item.custom) {
                    if (item.custom.isRange == true) {
                        if (item.type == "date") {
                            return 320;
                            //为年月日类型
                        } else if (item.type == "datetime") {
                            return 440;
                        } else {
                            return 260;
                        }
                    } else {
                        if (item.type == "date") {
                            return 200;
                            //为年月日类型
                        } else if (item.type == "datetime") {
                            return 260;
                        } else {
                            return 170;
                        }
                    }
                } else {
                    return 0;
                }
            }

            //创建单个查询条件选项
            function _createOptions(item) {
                //创建全部
                var strHTML = "";
                if (item.isMultiple || (!item.isMultiple && item.isShowAll)) {
                    strHTML = '<span title="全部" class="option_all {0}">全部</span>'.format((!item.defaults || item.defaults.length == 0) ? "selected" : "");
                }
                //是否设置了回调事件,r如果设置了回调事件 ，则只输出前10项
                var isHasExpandCallBack = _isHasExpandEvent(item);
                var max = MAX_SHOW_COUNT;
                if (isHasExpandCallBack) {
                    if (!isNaN(item.expand.max)) {
                        var iMax = parseInt(item.expand.max, 10);
                        max = max > iMax ? iMax : max;
                    }
                }

                //创建其余项,绑定默认选中值
                $(item.data).each(function (i, detail) {
                    //判断当前项是否为默认选中项
                    if (isHasExpandCallBack && (1 + i) > max) {
                        return;
                    }
                    strHTML += '<span title="{0}" data-id="{1}" data-value="{3}" {2}>{0}</span>'.format(detail[item.textField], i, $.inArray(detail[item.valueField], item.defaults) >= 0 ? "class='selected'" : "", detail[item.valueField]);
                });

                return strHTML;
            }

            //创建自定义查询条件选项
            function _createCustomFilter(i, item) {
                if (item.custom) {
                    var inputwidth = "70px";
                    if (item.type == "date") {
                        inputwidth = "100px";
                        //为年月日类型
                    } else if (item.type == "datetime") {
                        //为年月日时分秒类型
                        inputwidth = "160px";
                    }
                    var strHTML = '<div class="filter_custom" style="width:{0}px;"><span>自定义</span>'.format(_getCustomDivWidth(item));
                    strHTML += '<span><input type="text" id="{0}_c_custom_start" style="width:{1};"></span>'.format(item.id, inputwidth);
                    if (item.custom.isRange) {
                        //范围
                        strHTML += '<span>—</span>' +
                            '<span><input type="text" id="{0}_c_custom_end" {1}></span>'.format(item.id, inputwidth ? "style='width:{0}'".format(inputwidth) : "");
                    }
                    strHTML += '<span class="btn_filter_sure" data-id="{0}">确定</span></div>'.format(i);
                    return strHTML;
                } else {
                    return "";
                }
            }

            //获取当前查询框顺序
            function _getItemIndex(objthis) {
                return $(objthis).closest('.searchbox-item').attr("data-id");
            }

            //获取当前查询框ID
            function _getItemId(objthis) {
                return $(objthis).closest('.searchbox-item').attr("id").replace('searchitem_', '');
            }

            /*
             * 功能：    获取当前查询框绑定项
             * 参数：    当前项元素
             * 返回值：  当前项数据
             * 创建人：  杜冬军
             * 创建时间：2015-12-21
             */
            function _getItem(objthis) {
                var index = _getItemIndex(objthis);
                return settings.searchBoxs[index];
            }

            /*
             * 功能：    获取当前查询框最终搜索条件
             * 参数：    无
             * 返回值：  搜索条件
             * 创建人：  杜冬军
             * 创建时间：2015-12-24
             */
            function _getParamList() {
                var paramList = [];
                var value = null;
                $(settings.searchBoxs).each(function (i, item) {
                    value = {};
                    if (item.customSelectd.length > 0) {
                        //自定义
                        value[settings.paramCustomkey] = item.customSelectd;

                    } else {
                        value[settings.paramkey] = item.selected;
                    }
                    value["isMultiple"] = item.isMultiple;
                    value["id"] = item.srcID;
                    paramList.push(value);
                });

                return paramList;
            }

            /*
             * 功能：    获取当前查询框是否含有展开收缩回调事件
             * 参数：    当前项元素
             * 返回值：  bool
             * 创建人：  杜冬军
             * 创建时间：2015-12-21
             */
            function _isHasExpandEvent(item) {
                return item.expand && (typeof (item.expand.event) == "function");
            }

            /*
             * 功能：    每一个查询条件后面展开收缩监听事件处理
             * 参数：    event：event
             *           data：展开还是收缩
             *           that: 当前展开收缩元素
             * 返回值：  bool
             * 创建人：  杜冬军
             * 创建时间：2015-12-21
             */
            function _itemExpand(event, that, data) {
                event.cancelBubble = true;

                var state = _getExpandState(that);
                if (data && data == state) {
                    return;
                }

                var objcenter = $(that).siblings(".c");

                if (state == "expand") {
                    $(that).find(".text").text("收缩");
                    $(that).siblings(".c").css({ "height": "auto" });
                } else {
                    $(that).find(".text").text("展开");
                    objcenter.css({ height: 30 });
                }
                //修复如果有多个展开条件时，搜索框高度自适应问题
                if (filterBtn.find('span').text() == "展开条件") {
                    var expandItemNum = 0;
                    var expandheight = 0;
                    $(".searchbox-item").each(function (i, item) {
                        if ($(item).find(".text").text() == "收缩") {
                            expandItemNum++;
                            expandheight += $(item).find(".c").height();
                        }
                    });
                    var height = (settings.expandRow - expandItemNum) * 40 + 9 * expandItemNum + expandheight;
                    if (expandItemNum == 0) {
                        height = _expandHeight;
                    }
                    searchCtl.css({ 'height': height });
                }

                var item = _getItem(that);

                //回调事件
                if (_isHasExpandEvent(item)) {
                    item.expand.event(item.data, that, state);
                }


                /*
                 * 功能：    选项选中取消监听事件处理
                 * 参数：    that:
                 *           dataid：选项data-id序号
                 *           state：true 选中 false 取消
                 * 返回值：  无
                 * 创建人：  杜冬军
                 * 创建时间：2015-12-25
                 */
                function _changeState(that, dataid, state) {

                }

                /*
                 * 功能：    获取当前展开收缩按钮状态
                 * 参数：    当前项元素
                 * 返回值：  bool
                 * 创建人：  杜冬军
                 * 创建时间：2015-12-21
                 */
                function _getExpandState(obj) {
                    var objText = $(obj).find(".text");
                    if (objText.text() == '展开') {
                        return "expand";
                    } else {
                        return "collaspe";
                    }
                }
            }

            /*
             * 功能：   清空自定义查询框的值
             * 参数：   item  当前项元素
             * 返回值：  无
             * 创建人：  杜冬军
             * 创建时间：2015-12-25
             */
            function _clearCustomValue(item) {
                if (item.custom && item.customSelectd.length > 0) {
                    item.customSelectd = [];
                    //清除输入框的值
                    $("#{0}_c_custom_start".format(item.id)).val('');

                    if (item.custom.isRange) {
                        $("#{0}_c_custom_end".format(item.id)).val('');
                    }
                }
            }

            /*
             * 功能：   设置自定义查询框值
             * 参数：   item  当前项元素
             * 返回值：  无
             * 创建人：  杜冬军
             * 创建时间：2015-12-25
             */
            function _setCustomValue(item) {
                if (item.custom && item.customSelectd.length > 0) {
                    //清除输入框的值
                    $("#{0}_c_custom_start".format(item.id)).val(item.customSelectd[0]);
                    if (item.custom.isRange) {
                        $("#{0}_c_custom_end".format(item.id)).val(item.customSelectd[1]);
                    }
                }
            }


            /*
             * 功能：   重新给searchBox赋值
             * 参数：   arrOptionValue  每个过滤项值
             * 返回值：  无
             * 创建人：  杜冬军
             * 创建时间：2016-09-08
             */
            function _setSearchValue(arrOptionValue) {
                if ($.isArray(arrOptionValue)) {
                    var jsonMapper = {}, itemSet = null;
                    for (var i = 0, length = arrOptionValue.length; i < length; i++) {
                        itemSet = arrOptionValue[i];
                        jsonMapper[itemSet.id] = itemSet;
                    }
                    var itemSpans;

                    $(settings.searchBoxs).each(function (i, item) {
                        itemSet = jsonMapper[item.srcID];
                        //所有选项
                        itemSpans = $("#" + item.id).find(".filter_option span");
                        //清除当前选中
                        itemSpans.removeClass("selected");
                        //清除自定义选中值
                        _clearCustomValue(item);
                        //清除选中值
                        item.selected = [];

                        if (!itemSet) {
                            restoreToDefault(itemSpans, item);
                        } else {
                            var valueList = itemSet[settings.paramkey];
                            var customValueList = itemSet[settings.paramCustomkey];
                            if (valueList && valueList.length > 0) {
                                //选项赋值
                                for (var i = 0; i < valueList.length; i++) {
                                    itemSpans.filter("[data-value='{0}']".format(valueList[i])).addClass("selected");
                                    item.selected.push(valueList[i]);
                                    if (!item.isMultiple) {
                                        break;
                                    }
                                }
                            } else if (customValueList && customValueList.length > 0) {
                                //自定义选中赋值
                                for (var i = 0; i < customValueList.length; i++) {
                                    item.customSelectd.push(customValueList[i]);
                                }
                                _setCustomValue(item);
                            } else {
                                restoreToDefault(itemSpans, item);
                            }
                        }
                    });
                }

                //还原单项到默认状态
                function restoreToDefault(itemSpans, item) {
                    //该选项还原默认值
                    if (item.defaults.length == 0) {
                        //选中全部
                        itemSpans.filter(".option_all").addClass("selected");
                    } else {
                        for (var i = 0; i < item.defaults.length; i++) {
                            itemSpans.filter("[data-value='{0}']".format(item.defaults[i])).addClass("selected");
                            item.selected.push(item.defaults[i]);
                        }
                    }
                }
            }
            ////////////////////////////////////////私有方法////////////////////////////////////////

            return searchCtl.each(function () {
                this.getParamList = _getParamList;
                this.setValue = _setSearchValue;
                this.isFiterMore = true;
            });
        },
        /*
         * 功能：    获取搜索条件参数
         * 参数：    无
         * 返回值：  搜索条件参数
         * 创建人：  杜冬军
         * 创建时间：2015-12-24
         */
        getParamList: function () {
            var that = this[0];
            if (that.isFiterMore) {
                return that.getParamList();
            }
        },
        /*
         * 功能：    searchBox对外提供的调用函数
         * 参数：    options {"setValue":[]}  key为要调用的函数名称 value:为函数调用参数
         * 返回值：  函数返回值
         * 创建人：  杜冬军
         * 创建时间：2016-09-08
         */
        searchFunctionCall: function (options) {
            if ($.isPlainObject(options)) {
                var that = this[0];
                if (that.isFiterMore) {
                    for (var key in options) {
                        if ($.isFunction(that[key])) {
                            return that[key](options[key]);
                        } else {
                            console.error("查询插件fiterMore不支持“{0}”方法".format(key));
                            return null;
                        }
                    }
                }
            }
        }
    });
})(jQuery);
