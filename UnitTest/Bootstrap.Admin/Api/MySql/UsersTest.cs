﻿using Xunit;

namespace Bootstrap.Admin.Api.MySql
{
    [Collection("MySqlContext")]
    public class UsersTest : Api.UsersTest
    {
        public UsersTest(MySqlBAWebHost factory) : base(factory) { }
    }
}
