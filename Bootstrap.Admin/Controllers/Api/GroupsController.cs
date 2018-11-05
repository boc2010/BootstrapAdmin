﻿using Bootstrap.Admin.Query;
using Bootstrap.DataAccess;
using Longbow.Web.Mvc;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Bootstrap.Admin.Controllers.Api
{
    /// <summary>
    /// 
    /// </summary>
    [Route("api/[controller]")]
    public class GroupsController : Controller
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [HttpGet]
        public QueryData<object> Get(QueryGroupOption value)
        {
            return value.RetrieveData();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("{id}")]
        public Group Get(string id)
        {
            return GroupHelper.RetrieveGroups().FirstOrDefault(t => t.Id == id);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="value"></param>
        [HttpPost]
        public bool Post([FromBody]Group value)
        {
            return GroupHelper.SaveGroup(value);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="value"></param>
        [HttpDelete]
        public bool Delete([FromBody]IEnumerable<string> value)
        {
            return GroupHelper.DeleteGroup(value);
        }

        /// <summary>
        /// 获取部门授权
        /// </summary>
        /// <param name="id"></param>
        /// <param name="type"></param>
        /// <returns></returns>
        [HttpPost("{id}")]
        public IEnumerable<object> Post(string id, [FromQuery]string type)
        {
            IEnumerable<Group> ret = new List<Group>();
            switch (type)
            {
                case "user":
                    ret = GroupHelper.RetrieveGroupsByUserId(id);
                    break;
                case "role":
                    ret = GroupHelper.RetrieveGroupsByRoleId(id);
                    break;
                default:
                    break;
            }
            return ret.Select(p => new { p.Id, p.Checked, p.GroupName, p.Description });
        }

        /// <summary>
        /// 保存部门授权
        /// </summary>
        /// <param name="id"></param>
        /// <param name="groupIds"></param>
        /// <param name="type"></param>
        /// <returns></returns>
        [HttpPut("{id}")]
        public bool Put(string id, [FromBody]IEnumerable<string> groupIds, [FromQuery]string type)
        {
            var ret = false;
            switch (type)
            {
                case "user":
                    ret = GroupHelper.SaveGroupsByUserId(id, groupIds);
                    break;
                case "role":
                    ret = GroupHelper.SaveGroupsByRoleId(id, groupIds);
                    break;
                default:
                    break;
            }
            return ret;
        }
    }
}
