﻿using Xunit;

namespace Bootstrap.Admin.Api.SQLite
{
    [Collection("SQLiteContext")]
    public class UsersTest : Api.UsersTest
    {
        public UsersTest(SQLiteBAWebHost factory) : base(factory) { }
    }
}
