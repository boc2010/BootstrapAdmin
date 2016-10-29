﻿(function ($) {
    BootstrapAdmin = function (options) {
        var that = this;
        if (options.click !== undefined && options.click.constructor === Object) { options.click = $.extend({}, BootstrapAdmin.settings.click, options.click); }
        this.options = $.extend({}, BootstrapAdmin.settings, options);

        this.dataEntity = options.dataEntity;
        if (!(this.dataEntity instanceof DataEntity) && window.console) {
            window.console.log('初始化参数中没有DataEntity实例');
        }

        // handler click event
        for (name in this.options.click) {
            var ele = this.options.click[name];
            var cId = ele;
            var event = null;
            if ($.isArray(ele)) {
                for (index in ele) {
                    if (ele[index].id === undefined) {
                        window.console.log('options.click.assign[{0}].{1}.id 未设置控件id', ele[index].id, name);
                        continue;
                    }
                    cId = ele[index]['id'];
                    event = ele[index]['click'];
                    handler(cId, event);
                }
            }
            else handler(cId, event);
        }

        // handler modal window show event
        if (this.options.modal.constructor === String) {
            $('#' + this.options.modal).on('show.bs.modal', function (e) {
                if (that.options.validateForm.constructor === String) {
                    var v = $('#' + that.options.validateForm).validate();
                    v.currentElements.each(function () { $(this).popover('destroy'); })
                    v.resetForm();
                }
            });
        }

        function handler(cid, event) {
            var source = $("#" + cId);
            source.data('click', name);
            if (event !== null) source.data('event', event);
            source.click(function () {
                var method = $(this).data('click');
                BootstrapAdmin.prototype[method].call(that, this, $(this).data('event'));
            });
        }
    };

    BootstrapAdmin.VERSION = "1.0";
    BootstrapAdmin.Author = "Argo Zhang";
    BootstrapAdmin.Email = "argo@163.com";

    BootstrapAdmin.settings = {
        url: undefined,
        bootstrapTable: 'table',
        validateForm: 'dataForm',
        modal: 'dialogNew',
        click: {
            query: 'btn_query',
            create: 'btn_add',
            edit: 'btn_edit',
            del: 'btn_delete',
            save: 'btnSubmit',
            assign: []
        }
    };

    BootstrapAdmin.idFormatter = function (value, row, index) {
        return "<a class='edit' href='javascript:void(0)'>" + value + "</a>";
    };

    BootstrapAdmin.prototype = {
        constructor: BootstrapAdmin,
        idEvents: function () {
            var op = {
                dataEntity: $.extend({}, this.options.dataEntity),
                table: this.options.bootstrapTable,
                modal: this.options.modal
            };
            return {
                'click .edit': function (e, value, row, index) {
                    op.dataEntity.load(row);
                    $(op.table).bootstrapTable('uncheckAll');
                    $(op.table).bootstrapTable('check', index);
                    $('#' + op.modal).modal("show");
                }
            }
        },

        query: function () {
            if (this.options.bootstrapTable.constructor === String) $(this.options.bootstrapTable).bootstrapTable('refresh');
        },

        create: function () {
            if (this.dataEntity instanceof DataEntity) this.dataEntity.reset();
            if (this.options.modal.constructor === String) $('#' + this.options.modal).modal("show");
            if (this.options.bootstrapTable.constructor === String) $(this.options.bootstrapTable).bootstrapTable('uncheckAll');
        },

        edit: function () {
            var options = this.options;
            if (options.bootstrapTable.constructor !== String) return;
            var arrselections = $(options.bootstrapTable).bootstrapTable('getSelections');
            if (arrselections.length == 0) {
                swal('请选择要编辑的数据', "编辑操作", "warning");
            }
            else if (arrselections.length > 1) {
                swal('请选择一个要编辑的数据', "编辑操作", "warning");
            }
            else {
                if (this.dataEntity instanceof DataEntity) this.dataEntity.load(arrselections[0]);
                if (options.modal.constructor === String) $('#' + options.modal).modal("show");
            }
        },

        del: function () {
            var options = this.options;
            if (options.bootstrapTable.constructor !== String) return;
            var arrselections = $(options.bootstrapTable).bootstrapTable('getSelections');
            if (arrselections.length == 0) {
                swal('请选择要删除的数据', "删除操作", "warning");
                return;
            }
            else {
                swal({
                    title: "您确定要删除吗？",
                    text: "删除操作",
                    type: "warning",
                    showCancelButton: true,
                    closeOnConfirm: true,
                    confirmButtonText: "是的，我要删除",
                    confirmButtonColor: "#d9534f",
                    cancelButtonText: "取消"
                }, function () {
                    var iDs = arrselections.map(function (element, index) { return element.ID }).join(",");
                    options.IDs = iDs;
                    $.ajax({
                        url: options.url,
                        data: { "": iDs },
                        type: 'DELETE',
                        success: function (result) {
                            if ($.isFunction(options.success)) options.success('del', options);
                            if (result) setTimeout(function () { swal("成功！", "删除数据", "success"); $(options.bootstrapTable).bootstrapTable('refresh'); }, 100);
                            else setTimeout(function () { swal("失败", "删除数据", "error"); }, 200);
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            swal("失败", "删除数据", "error");
                        }
                    });
                });
            }
        },

        save: function () {
            var options = $.extend({ data: {} }, this.options);
            if (this.dataEntity instanceof DataEntity) options = $.extend(options, { data: this.dataEntity.get() });
            if (options.validateForm.constructor === String && !$("#" + options.validateForm).valid()) return;
            $.ajax({
                url: options.url,
                data: options.data,
                type: 'POST',
                success: function (result) {
                    if (result) {
                        if ($.isFunction(options.success)) options.success('save', options.data);
                        if (options.bootstrapTable.constructor === String && options.data.ID.constructor === String) {
                            // 更新表格
                            if (options.data.ID > 0) {
                                var allTableData = $(options.bootstrapTable).bootstrapTable('getData');
                                for (index = 0; index < allTableData.length; index++) {
                                    var temp = allTableData[index];
                                    if (temp.ID == options.data.ID) {
                                        $(options.bootstrapTable).bootstrapTable('updateRow', { index: index, row: $.extend(temp, options.data) });
                                        break;
                                    }
                                }
                            }
                            else {
                                $(options.bootstrapTable).bootstrapTable('refresh');
                            }
                        }
                        if (options.modal.constructor === String) $('#' + options.modal).modal("hide");
                        swal("成功", "保存数据", "success");
                    }
                    else {
                        swal("失败", "保存数据", "error");
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    swal("失败", "保存数据失败", "error");
                }
            });
        },

        assign: function (eventSrc, callback) {
            var options = this.options;
            if (options.bootstrapTable.constructor !== String) return;
            var arrselections = $(options.bootstrapTable).bootstrapTable('getSelections');
            if (arrselections.length == 0) {
                swal('请选择要编辑的数据', "编辑操作", "warning");
            }
            else if (arrselections.length > 1) {
                swal('请选择一个要编辑的数据', "编辑操作", "warning");
            }
            else {
                if ($.isFunction(callback)) {
                    callback.call(eventSrc, arrselections[0]);
                }
            }
        },

    };

    var processRolesData = function (options) {
        var data = $.extend({ data: { type: "" }, method: "POST", Id: "" }, options);
        $.ajax({
            url: '../api/Roles/' + data.Id,
            data: data.data,
            type: data.method,
            success: function (result) {
                if ($.isFunction(data.callback)) {
                    if ($.isArray(result)) {
                        var html = $.map(result, function (element, index) {
                            return $.format('<div class="checkbox col-lg-3 col-xs-4"><label title="{3}"><input type="checkbox" value="{0}" {2}>{1}</label></div>', element.ID, element.RoleName, element.Checked, element.Description);
                        }).join('');
                        data.callback(html);
                        return;
                    }
                }
                else if ($.isPlainObject(data.callback) && data.callback.modal !== undefined) {
                    $("#" + data.callback.modal).modal('hide');
                }
                if (result) { swal("成功", "授权角色", "success"); }
                else { swal("失败", "授权角色", "error"); }
                data.callback(result);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if ($.isFunction(data.callback)) data.callback(false);
            }
        });
    }

    Role = {};
    Role.getRolesByUserId = function (userId, callback) {
        processRolesData({ Id: userId, callback: callback, data: { type: "user" } });
    };
    Role.getRolesByGroupId = function (groupId) {
        processRolesData({ Id: groupId, callback: callback, data: { type: "group" } });
    };
    Role.getRolesByMenuId = function (menuId, callback) {
        processRolesData({ Id: menuId, callback: callback, data: { type: "menu" } });
    };
    Role.saveRolesByUserId = function (userId, roleIds, callback) {
        processRolesData({ Id: userId, callback: callback, method: "PUT", data: { type: "user", roleIds: roleIds } });
    }
    Role.saveRolesByMenuId = function (menuId, roleIds, callback) {
        processRolesData({ Id: menuId, callback: callback, method: "PUT", data: { type: "menu", roleIds: roleIds } });
    };

    var processUsersData = function (options) {
        var data = $.extend({ data: { type: "" }, method: "POST", Id: "" }, options);
        $.ajax({
            url: '../api/Users/' + data.Id,
            data: data.data,
            type: data.method,
            success: function (result) {
                if ($.isFunction(data.callback)) {
                    if ($.isArray(result)) {
                        var html = $.map(result, function (element, index) {
                            return $.format('<div class="checkbox col-lg-3 col-xs-4"><label><input type="checkbox" value="{0}" {2}>{1}</label></div>', element.ID, element.DisplayName, element.Checked);
                        }).join('');
                        data.callback(html);
                        return;
                    }
                }
                else if ($.isPlainObject(data.callback) && data.callback.modal !== undefined) {
                    $("#" + data.callback.modal).modal('hide');
                }
                if (result) { swal("成功", "授权用户", "success"); }
                else { swal("失败", "授权用户", "error"); }
                data.callback(result);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if ($.isFunction(data.callback)) data.callback(false);
            }
        });
    }

    User = {};
    User.getUsersByRoleId = function (roleId, callback) {
        processUsersData({ Id: roleId, callback: callback, data: { type: "role" } });
    };
    User.saveUsersByRoleId = function (roleId, userIds, callback) {
        processUsersData({ Id: roleId, callback: callback, method: "PUT", data: { type: "role", userIds: userIds } });
    }

    var processGroupsData = function (options) {
        var data = $.extend({ data: { type: "" }, method: "POST", Id: "" }, options);
        $.ajax({
            url: '../api/Groups/' + data.Id,
            data: data.data,
            type: data.method,
            success: function (result) {
                if ($.isFunction(data.callback)) {
                    if ($.isArray(result)) {
                        var html = $.map(result, function (element, index) {
                            return $.format('<div class="checkbox col-lg-3 col-xs-4"><label title="{3}"><input type="checkbox" value="{0}" {2}>{1}</label></div>', element.ID, element.GroupName, element.Checked, element.Description);
                        }).join('');
                        data.callback(html);
                        return;
                    }
                }
                else if ($.isPlainObject(data.callback) && data.callback.modal !== undefined) {
                    $("#" + data.callback.modal).modal('hide');
                }
                if (result) { swal("成功", "授权角色", "success"); }
                else { swal("失败", "授权角色", "error"); }
                if ($.isFunction(data.callback))  data.callback(result);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if ($.isFunction(data.callback)) data.callback(false);
            }
        });
    }

    Group = {};
    Group.getGroupsByUserId = function (userId, callback) {
        processGroupsData({ Id: userId, callback: callback, data: { type: "user" } });
    };
    Group.saveGroupsByUserId = function (userId, groupIds, callback) {
        processGroupsData({ Id: userId, callback: callback, method: "PUT", data: { type: "user", groupIds: groupIds } });
    };
    Group.getGroupsByRoleId = function (roleId,callback) {
        processGroupsData({ Id: roleId, callback: callback, data: { type: "role" } });
    };
    Group.saveGroupsByRoleId = function (roleId,groupIds,callback) {
        processGroupsData({ Id: roleId, callback: callback, method: "PUT", data: { type: "role", groupIds: groupIds } });
    };
    };
})(jQuery);