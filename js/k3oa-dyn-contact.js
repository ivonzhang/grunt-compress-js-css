/**
 * 选人控件V1.0.1
 */
(function($) {
    'use strict';
    $.extend({
        isValidArray: function(array){
            if($.isArray(array) && array.length > 0) {
                return true;
            }
            return false;
        }
    });
    /**
     * 后台数据访问
     */
    var _usAjax = $.dynbase.extend({
        _class_name: 'cn.firstsoft.firstframe.plugins.dyn.base.service.ContactService',
        _user_id: undefined,      //用于获取最近联系人
        _module: undefined,       //用于常用联系人获取和新增
        _dept_cache: {'-1': []},  //缓存,默认缓存一个虚节点
        _isInit: false,			  //用于判断是否初始化
        _available: true,		  //用于判断常用联系人服务是否可用

        /**
         * settings: {
		 *     userId: <userid>,
		 *     server: <oaurl>,
		 *     module: <module>
		 * }
         */
        init: function(settings, callback) {
            var self = this;
            self._user_id = settings.userId;
            self._module = settings.module;
            self._dept_cache = {};
            self._init(settings.server, callback);
        },
        /**
         * 根据部门编号获取部门信息
         * @param ids{Array} 部门编号
         */
        root: function(ids, callback) {
            var self = this;
            $.dyntoast.startLoading();
            self._post_ajax_jr('root', ids, function(status, data) {
                $.dyntoast.stopLoading();
                self._call(callback, [status, data]);
            });
        },
        /**
         * 获取指定部门下的部门及成员列表
         * @param deptId 部门编号
         * @param callback 回调
         */
        list: function(deptId, callback) {
            var self = this;
            if ( deptId !== undefined ) {
                var _data = self._dept_cache[deptId];
                if ( _data ) {
                    self._call(callback, [true, _data]);
                    return;
                }
            }
            $.dyntoast.startLoading();
            self._post_ajax_jr('list', [deptId, true], function(status, data) {
                $.dyntoast.stopLoading();
                if ( status === true ) {
                    self._dept_cache[deptId] = data;
                }
                self._call(callback, [status, data]);
            });
        },

        /**
         * 获取最近联系人
         */
        query: function(count, callback) {
            var self = this;
            if(!self._available) {
                //常用联系人服务不可用
                self._call(callback,[false, []]);
                return ;
            }
            var _params = [self._user_id, self._module];
            if ( $.isNumeric(count) ) {
                _params.push(count);
            }
            $.dyntoast.startLoading();
            self._post_ajax_jr('query', _params, function(status, data){
                $.dyntoast.stopLoading();
                self._call(callback,[status, data]);
            });
        },

        /**
         * 新增最近联系人
         */
        append: function(ids, callback) {
            var self = this;
            if(!self._available) {
                self._call(callback, [false, '服务不可用']);
                return ;
            }
            if($.isArray(ids) && ids.length > 0){
                var _params = [self._user_id, self._module].concat(ids);
                self._post_ajax_jr('append', _params, callback);
            }
        },

        /**
         * 根据关键字查找用户
         */
        search: function(text, ids, callback) {
            var self = this;
            var _params = [text];
            if($.isArray(ids) ) {
                _params = _params.concat(ids);
            }
            $.dyntoast.startLoading();
            self._post_ajax_jr('search', _params, function(status, data) {
                $.dyntoast.stopLoading();
                self._call(callback, [status, data]);
            });
        }
    });

    /**
     * 获取用户头像
     */
    var _workflow = $.dynbase.extend('workflow', {
        _class_name: 'cn.firstsoft.firstframe.plugins.dyn.workflow.service.WorkflowService',
        photoURL: function(id) {
            var self = this;
            return self._download('loadPhoto', {
                params: id
            });
        }
    });

    var _us, _us_fc, _us_fw, _us_footer, _us_user_item, _us_dept_item, _us_selected_item, _us_nav_item;
    _us = '<div class="aui-content us_12_11"></div>';

    _us_fc =
        '<div class="us-fc" style="display: none;">'
        +	'<div class="us-fc-top">'
        +   	'<div class="aui-searchbar-wrap">'
        +       	'<div class="aui-searchbar aui-border-radius">'
        +           	'<i class="aui-iconfont aui-icon-search"></i>'
        +           	'<div class="aui-searchbar-text">搜索</div>'
        +           	'<div class="aui-searchbar-input">'
        +           		'<form action="" onsubmit="return false;">'
        +               		'<input type="search" name="keyword" placeholder="请输入搜索内容">'
        +           		'</form>'
        +       		'</div>'
        +      	 		'<i class="aui-iconfont aui-icon-roundclosefill" style="display: none;"></i>'
        +   		'</div>'
        +		'</div>'
        +   	'<div class="us-fc-fw">'
        +       	'<ul class="aui-list-view">'
        +           	'<li class="aui-list-view-cell aui-img">'
        +               	'<span class="aui-img-object aui-pull-left"></span>'
        +               	'<div class="aui-img-body aui-arrow-right">'
        +                   	'<span class="title">组织架构</span>'
        +               	'</div>'
        +           	'</li>'
        +      		'</ul>'
        +   	'</div>'
        +	'</div>'
        +   '<div class="us-fc-content contact">'
        +       '<p class="subtitle">常用联系人</p>'
        +       '<ul class="aui-list-view u-list-view">'
        +       '</ul>'
        +   '</div>'
        +   '<div class="us-fc-content limit ">'
        +       '<p class="subtitle">可选成员</p>'
        +       '<ul class="aui-list-view u-list-view">'
        +       '</ul>'
        +   '</div>'
        +   '<div class="us-fc-content search ">'
        +       '<p class="subtitle">搜索结果</p>'
        +       '<ul class="aui-list-view u-list-view">'
        +       '</ul>'
        +   '</div>'
        +'</div>';

    _us_fw =
        '<div class="us-fw" style="display:none;">'
        +   '<div class="us-fw-nav nav">'
        +        '<ul class="title">'
        +       '</ul>'
        +   '</div>'
        +   '<div class="us-fw-content">'
        +       '<div class="us-fw-leader aui-hidden">'
        +           '<p class="subtitle">负责人</p>'
        +           '<ul class="aui-list-view u-list-view">'
        +           '</ul>'
        +       '</div>'
        +       '<div class="us-fw-user">'
        +           '<p class="subtitle">成员</p>'
        +           '<ul class="aui-list-view u-list-view">'
        +           '</ul>'
        +       '</div>'
        +       '<div class="us-fw-dept">'
        +           '<p class="subtitle">下级部门</p>'
        +           '<ul class="aui-list-view">'
        +           '</ul>'
        +       '</div>'
        +   '</div>'
        +'</div>';
    _us_footer =
        '<div class="us-footer tab">'
        +   '<div class="us-selected">'
        +       '<ul class="">'
        +       '</ul>'
        +   '</div>'
        +   '<div class="us-btn-wrap">'
        +		'<button class="aui-btn  aui-btn-block cancel">取消</button>'
        +       '<button class="aui-btn  aui-btn-block ok">确认</button>'
        +   '</div>'
        +'</div>';
    _us_user_item =
        '<li class="aui-list-view-cell aui-img">'
        +   '<div class=" aui-pull-left">'
        +       '<i class="aui-iconfont aui-icon-round"></i>'
        +           '<img class="aui-img-object photo" src="arch.png">'
        +   '</div>'
        +   '<div class="aui-img-body">'
        +       '<span class="name title"></span>'
        +       '<p class="duty subtitle"></p>'
        +   '</div>'
        + '</li>';
    _us_dept_item =
        '<li class="aui-list-view-cell">'
        +   '<div class="aui-arrow-right"></div>'
        +'</li>';
    _us_selected_item = '<li><i class="aui-iconfont aui-icon-roundclosefill warn"></i></li>';
    _us_nav_item = '<li></li>';



    var EVENT_CLICK = 'click', EVENT_BLUR = 'blur', EVENT_FOCUS = 'click', EVENT_INPUT = 'input', EVENT_SEARCH = 'search';
    //SEARCH
    var SEARCH_WRAP_CLASS =  '.us-fc .aui-searchbar-wrap',
        SEARCH_WRAPF_CLASS = '.us-fc .aui-searchbar-wrap.focus',
        SEARCH_BAR_CLASS =   '.us-fc .aui-searchbar-wrap .aui-searchbar',
        SEARCH_INPUT_CLASS = '.us-fc .aui-searchbar-wrap .aui-searchbar-input input',
        SEARCH_CLOSE_CLASS = '.us-fc .aui-searchbar-wrap .aui-icon-roundclosefill';
    /**
     * 默认对象
     * @private
     */
    var _default_options = {
        multiple: false,         // 是否允许多选，默认为false
        //allowEmpty: false,     // 是否允许不选，默认为false
        contact: {
            maxCount: 5          // 最近联系人列表的最大数目，默认为5
        },
        module: 'workflow',      // 业务模块标识,用户获取最近联系人时使用
        server: '../../../..',   // OA服务访问路径，一般使用相对路径
        dept: [],                // 指定部门列表，数组元素为部门ID，整数
        users: [],               // 初始选中的用户列表，数组元素为用户对象
        candidates: [],          // 指定的候选人列表，用户只能从此列表中选择用户
        ok: $.noop,              // 点击确定按钮时的回调函数，用户和选择结果将从回调函数的参数返回
        cancel: $.noop         // 点击取消按钮时的回调函数
    };

    var _contact = {
        /**
         * 处理搜索输入框的onfocus事件
         */
        onFocus: function() {
            if($(SEARCH_INPUT_CLASS).val() !== ''){
                $(SEARCH_CLOSE_CLASS).show();
            }else {
                $(SEARCH_CLOSE_CLASS).hide();
            }
        },
        /**
         * 处理搜索输入框的onblur事件
         */
        onBlur: function(){
            $('.us_12_11 .us-footer').show();
            if($(SEARCH_INPUT_CLASS).val() === '') {
                $(SEARCH_WRAP_CLASS).removeClass('focus');
            }
        },
        /**
         * 处理搜索输入框的oninput事件
         */
        onInput: function(){
            if($(SEARCH_INPUT_CLASS).val() !== ''){
                $(SEARCH_CLOSE_CLASS).show();
            }else {
                $(SEARCH_CLOSE_CLASS).hide();
            }
        },
        /**
         * 清空搜索输入框
         */
        clearInput: function () {
            //清除输入框内容
            $(SEARCH_INPUT_CLASS).val('');
            //切换到常用联系人页签
            $('.us_12_11 .us-fc .us-fc-content').hide().filter('.contact').show();
            //隐藏清空按钮
            $(SEARCH_CLOSE_CLASS).hide();
        },
        /**
         * 将搜索框设置为选中状态
         */
        doSearch: function () {
            //隐藏footer
            $('.us_12_11 .us-footer').hide();
            $(SEARCH_WRAP_CLASS).addClass('focus');
            $(SEARCH_INPUT_CLASS).focus();
        },

        /**
         * 检索成员
         */
        search: function () {
            var usSelf = this;
            var keyword = $.trim($(SEARCH_INPUT_CLASS).val());
            if(keyword !== ''){
                _usAjax.search(keyword,[], function(status, data){
                    if(status === true && data.length > 0){
                        $('.us_12_11 .us-fc .us-fc-content').hide();
                        var $parent = $('.us_12_11 .us-fc .us-fc-content.search');
                        $parent.show();
                        usSelf.addUserNodes($parent.children('ul'), data);
                    }else if(data.length === 0){
                        $.dyntoast.info('无相关成员');
                    }
                });
            }else {
                $.dyntoast.info('关键词不能为空');
            }
            $(SEARCH_INPUT_CLASS).blur();
        },
        //确认按钮点击事件的处理函数
        ok: function() {
            var self = this;
            var result = [], ids = [];
            $('.us_12_11 .us-footer .us-selected ul li').each(function(index, item) {
            /*    user = {
                    id: $(this).attr('data-id'),
                    name: $(this).attr('data-name'),
                    type: $(this).attr('data-type')
                }; */
                var _user = $(this).data('user');
                result.push(_user);
                ids.push(_user.id)
            });
            if($.isFunction(_default_options.ok)){
                _default_options.ok(result);
            }
            //隐藏选人控件
            $('.us_12_11, .us_12_11 > .fc, .us_12_11 > .us-fw').hide();
            //清空列表(常用联系人、候选联系人、已选成员、部门导航栏)
            $('.us_12_11 .us-fw .us-fw-nav ul, .us_12_11 .us-fc .us-fc-content ul, .us_12_11 .us-footer .us-selected ul').empty();
            //清除搜索框内容
            self.clearInput();
            self.onBlur();
            //清空候选部门、候选人、已选成员的缓存数据
            $.extend(_default_options, {
                candidates: [],
                dept: [],
                users: []
            });
            //追加常用联系人
            if(ids.length > 0) {
                _usAjax.append(ids, $.noop);
            }
        },
        // 取消按钮点击事件的处理函数 add by zhangf
        cancel: function() {
        	if($.isFunction(_default_options.cancel)){
                _default_options.cancel();
            }
            var $us = $('.us_12_11');
        	$us.hide();
        },
        /**
         * 初始化
         */
        init: function() {
            var usSelf = this;
            _workflow.init(_default_options.server, function(status, data){
                if(status !== true) {
                    $.dyntoast.error("服务初始化失败");
                }
            });
            _usAjax.init({
                userId: _default_options.uid,
                module: _default_options.module,
                server: _default_options.server
            }, function(status, data){
                if(status === true) {
                    _usAjax._isInit = true;
                    _usAjax._available = data.available;
                    usSelf.show();
                }else {
                    $.dyntoast.error("服务初始化失败");
                }
            });
        },
        /**
         * 成员列表增加节点
         * @param parent{Object} 待追加节点的元素
         * @param nodes{Array} 子节点数组对象
         */
        addUserNodes: function(parent, nodes) {
            //清空成员列表
            parent.empty().show();
            //判断是否存在成员
            if(nodes.length === 0) {
                $('.us_12_11 .us-fw .us-fw-user').hide();
                return ;
            }
            //添加成员
            var usSelf = this;
            if($.isValidArray(nodes)){
                $.each(nodes, function(index, item) {
                    usSelf.addUserNode(parent, item);
                });
            }
            //成员列表为空则隐藏父元素
            parent.children().length === 0 ? parent.parent().hide() : parent.parent().show();
        },
        addUserNode: function(parent, node) {
            var usSelf = this;
            var $userItem = $(_us_user_item);
            $userItem.attr('data-id', node.id).data('user', node);
            $userItem.find('img.photo').attr("src",_workflow.photoURL(node.id));
            $userItem.find('.aui-img-body span.name').text(node.name);
            $userItem.find('.aui-img-body p.duty').text(node.duty);
            $userItem.bind(EVENT_CLICK, function(){
                if($(this).find('i').hasClass('active')){
                    $(this).find('i').removeClass('active');
                    $('.us_12_11 .us-footer .us-selected ul').children('li[data-id='+node.id+']').remove();
                }else {
                    //判断是否允许多选
                    if(!_default_options.multiple){
                        if($('.us_12_11 .us-footer .us-selected ul li').length !== 0) {
                            $.dyntoast.info('已设置单选');
                            return ;
                        }
                    }
                    usSelf.addSelectedNode($('.us_12_11 .us-footer .us-selected ul'), node);
                    $(this).find('i').addClass('active');
                }
            });
            //判断该用户是否已选
            if($('.us_12_11 .us-footer .us-selected ul li[data-id='+node.id+']').length !== 0) {
                $userItem.find('i').addClass('active');
            }
            parent.append($userItem);
        },
        /**
         * 下级部门列表增加节点
         * @param parent{Object} 待追加节点的元素
         * @param nodes{Array} 子节点数组对象
         */
        addDeptNodes: function(parent, nodes) {
            //清空下级部门列表
            parent.empty().show();
            //判断是否存在下级部门
            if(nodes.length === 0) {
                parent.parent().hide();
                return ;
            }
            //添加部门节点
            var usSelf = this;
            if($.isValidArray(nodes)){
                $.each(nodes, function(index, item) {
                    usSelf.addDeptNode(parent, item);
                });
            }
            //下级部门列表为空则隐藏父元素
            parent.children().length === 0 ? parent.parent().hide() : parent.parent().show();
        },
        addDeptNode: function(parent, node) {
            var usSelf = this;
            var $deptItem = $(_us_dept_item);
            $deptItem.find('div').text(node.name);
            $deptItem.bind(EVENT_CLICK, function(){
                var self = this;
                _usAjax.list(node.id, function(status, data){
                    if(status === true) {
                        usSelf.addNodes(data);
                        usSelf.addNavNode(node);
                    }
                });
            });
            parent.append($deptItem);
        },
        /**
         * 已选成员列表增加节点
         * @param parent{Object} 待追加节点的元素
         * @param nodes{Array} 子节点数组对象
         */
        addSelectedNodes: function(parent, nodes) {
            var usSelf = this;
            $.each(nodes, function(index, item) {
                usSelf.addSelectedNode(parent, item);
            });
        },
        addSelectedNode: function(parent, node){
            var $selectedItem = $(_us_selected_item);
            $selectedItem.attr('data-id', node.id).data('user', node);
            $selectedItem.children('i').bind(EVENT_CLICK, function() {
                $('.us_12_11 .us-fc .us-fc-content ul li[data-id='+$(this).parent().attr('data-id')+']').find('i').removeClass('active');
                $('.us_12_11 .us-fw .us-fw-content .us-fw-user ul li[data-id='+$(this).parent().attr('data-id')+']').find('i').removeClass('active');
                $(this).parent().remove();
            });
            $selectedItem.css('background-image','url('+_workflow.photoURL(node.id)+')');
            parent.append($selectedItem);
        },
        /**
         * 添加子节点(下级部门和成员列表)
         * @param nodes{Array} 子节点
         */
        addNodes: function(nodes) {
            var usSelf = this,
                uParent = $('.us_12_11 .us-fw .us-fw-user ul').empty().show(),
                dParent = $('.us_12_11 .us-fw .us-fw-dept ul').empty().show();
            $.each(nodes, function(index, item){
                //根据是否包含性别来判断部门或成员
                if(typeof item.sex !== 'undefined') {
                    //添加用户
                    usSelf.addUserNode(uParent, item);
                }else {
                    //添加 部门
                    usSelf.addDeptNode(dParent, item);
                }
            });
            uParent.children().length === 0 ? uParent.parent().hide() : uParent.parent().show();
            dParent.children().length === 0 ? dParent.parent().hide() : dParent.parent().show();
        },
        /**
         * 部门层级导航栏列表添加
         * @param nodes{Array} 子节点数组对象
         */
        addNavNode: function(node){
            var usSelf = this;
            var $navItem = $(_us_nav_item);
            $navItem.attr('data-id', node.id).data('user', node);
            $navItem.text(node.name);

            //为同胞上个节点绑定点击事件
            $('.us_12_11 .us-fw .us-fw-nav ul li:last-child').addClass('active').bind(EVENT_CLICK, function(){
                var self = this;
                _usAjax.list($(this).attr('data-id'),function(status, data){
                    if(status === true) {
                        usSelf.addNodes(data);
                        //删除导航下级部门
                        $(self).removeClass('active').nextAll().remove();
                        $(self).unbind(EVENT_CLICK);
                    }else {
                        $.dyntoast.error("加载数据出错");
                    }
                });
            });
            $navItem.appendTo($('.us_12_11 .us-fw .us-fw-nav ul'));
        },

        /**
         * 显示选人界面
         * @param options
         */
        show: function() {
            var usSelf = this;
            var $us = $('.us_12_11');
            if($us.length === 0) {
                //第一次打开选人页面
                $us = $(_us);
                //常用联系人
                var $usFc = $(_us_fc);
                $usFc.find('.aui-searchbar-wrap .aui-searchbar').bind(EVENT_CLICK, usSelf.doSearch);
                $usFc.find('.aui-searchbar-wrap .aui-searchbar .aui-searchbar-input input')
                    .bind(EVENT_SEARCH, usSelf.search.bind(usSelf))
                    .bind(EVENT_INPUT, usSelf.onInput)
                    .bind(EVENT_BLUR, usSelf.onBlur)
                    .bind(EVENT_FOCUS, usSelf.onFocus.bind(usSelf));
                $usFc.find('.aui-searchbar-wrap .aui-icon-roundclosefill').bind(EVENT_CLICK, usSelf.clearInput);
                $usFc.find('.us-fc-fw ul li').bind(EVENT_CLICK, function(){
                    //隐藏常用联系人界面
                    $us.find('.us-fc').hide();
                    _usAjax.list(0, function(status, data){
                        if(status === true) {
                            usSelf.addNavNode(data[0]);
                            _usAjax.list(data[0].id, function(status, data){
                                if(status === true){
                                    usSelf.addNodes(data);
                                }
                            });
                            $us.find('.us-fw').show();
                        }else {
                            $.dyntoast.error("获取组织树出错");
                        }
                    });
                });
                $usFc.appendTo($us);
                //组织架构树
                var $usFw = $(_us_fw);
                $usFw.appendTo($us);
                var $usFooter = $(_us_footer);
                //确认按钮绑定点击事件
                $usFooter.find('.us-btn-wrap button.ok').bind(EVENT_CLICK, usSelf.ok.bind(usSelf));
                //取消按钮绑定点击事件
                $usFooter.find('.us-btn-wrap button.cancel').bind(EVENT_CLICK, usSelf.cancel.bind(usSelf));
                $usFooter.appendTo($us);
                //添加到body
                $us.appendTo($('body'));
            }
            //显示选人控件界面
            $us.show();

            //更新已选成员列表
            usSelf.addSelectedNodes($us.find('.us-footer .us-selected ul'), _default_options.users);

            //根据参数做一些特殊处理
            if($.isValidArray(_default_options.candidates)){
                //1、指定候选人的情况
                //隐藏搜索框、组织架构树的入口、常用联系人
                $us.find('.us-fc > .us-fc-top, .us-fc > .us-fc-content').hide();
                //增加并显示可选成员列表
                usSelf.addUserNodes($us.find('.us-fc .us-fc-content.limit ul'), _default_options.candidates);
                $us.find('.us-fc, .us-fc > .us-fc-content.limit').show();
            }else if($.isValidArray(_default_options.dept)) {
                //2、指定了部门，则直接跳转到组织架构树
                //隐藏搜索框、组织架构树的入口、常用联系人
                $us.find('.us-fc, .us-fc > .us-fc-top, .us-fc > .us-fc-content').hide();
                //根据指定的部门编号数组获取对应的对象
                _usAjax.root(_default_options.dept, function(status, data) {
                    if(status === true && data.length > 0) {
                        //设置一个虚节点,用于保存指定的候选部门信息
                        _usAjax._dept_cache[-1] = data;
                        //清空部门导航栏
                        $us.find('.us-fw .us-fw-nav ul').empty();
                        usSelf.addNavNode({
                            id: -1,
                            name: '候选部门',
                            type: -1
                        });
                        var $dept = $us.find('.us-fw .us-fw-dept');
                        $dept.show();
                        usSelf.addDeptNodes($dept.children('ul'), data);
                        $us.find('.us-fw .us-fw-user').hide();
                        $us.find('.us-fw .us-fw-dept ul').show();
                        $us.find('.us-fw').show();
                    }else {
                        $.dyntoast.warn('无效的部门编号');
                    }
                });
            }else {
                //3、一般情况，显示组织树入口，加载常用联系人
                $us.find('.us-fc, .us-fc > .us-fc-top, .us-fc > .us-fc-content.contact').show();
                _usAjax.query(_default_options.count, function(status, data) {
                    if(status === true && data.length > 0){
                        $us.find('.us-fc .us-fc-content.contact').show();
                        usSelf.addUserNodes($us.find('.us-fc .us-fc-content.contact ul'), data);
                    }else {
                        //隐藏常用联系人列表
                        $us.find('.us-fc .us-fc-content.contact').hide();
                    }
                });
            }
        }
    };
    $.extend({
        showContact:  function(options) {
            $.extend(_default_options, options || {});
            if(_usAjax._isInit) {
                _contact.show();
            }else {
                _contact.init();
            }
        }
    });
})(jQuery);