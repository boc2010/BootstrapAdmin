﻿using BootstrapAdmin.Web.Core;
using BootstrapAdmin.Web.Services;
using BootstrapAdmin.Web.Services.SMS;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.Security.Claims;

namespace Bootstrap.Admin.Controllers
{
    /// <summary>
    /// Account controller.
    /// </summary>
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private const string MobileSchema = "Mobile";

        #region UserLogin
        /// <summary>
        /// Login the specified userName, password and remember.
        /// </summary>
        /// <returns>The login.</returns>
        /// <param name="userName">User name.</param>
        /// <param name="password">Password.</param>
        /// <param name="remember">Remember.</param>
        /// <param name="userService"></param>
        /// <param name="dictService"></param>
        /// <param name="loginService"></param>
        [HttpPost]
        public async Task<IActionResult> Login(string userName, string password, [FromQuery] string? remember,
            [FromServices] IUser userService,
            [FromServices] IDict dictService,
            [FromServices] ILogin loginService)
        {
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(password))
            {
                return RedirectLogin();
            }

            var auth = userService.Authenticate(userName, password);
            var persistent = remember == "true";
            var period = 0;
            if (persistent)
            {
                // Cookie 持久化
                period = dictService.GetCookieExpiresPeriod();
            }
            await loginService.Log(userName, auth);

            return auth ? await SignInAsync(userName, persistent, period) : RedirectLogin();
        }

        private async Task<IActionResult> SignInAsync(string userName, bool persistent, int period = 0, string authenticationScheme = CookieAuthenticationDefaults.AuthenticationScheme)
        {
            var identity = new ClaimsIdentity(authenticationScheme);
            identity.AddClaim(new Claim(ClaimTypes.Name, userName));
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity), new AuthenticationProperties { ExpiresUtc = DateTimeOffset.Now.AddDays(period), IsPersistent = persistent });

            // redirect origin url
            var originUrl = Request.Query[CookieAuthenticationDefaults.ReturnUrlParameter].FirstOrDefault() ?? "/Home/Index";
            return Redirect(originUrl);
        }

        private IActionResult RedirectLogin()
        {
            var query = Request.Query.Aggregate(new Dictionary<string, string?>(), (d, v) =>
            {
                d.Add(v.Key, v.Value.ToString());
                return d;
            });
            return Redirect(QueryHelpers.AddQueryString(Request.PathBase + CookieAuthenticationDefaults.LoginPath, query));
        }
        #endregion

        #region Logout
        /// <summary>
        /// Logout this instance.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="appId"></param>
        /// <returns>The logout.</returns>
        [HttpGet]
        public async Task<IActionResult> Logout([FromServices] BootstrapAppContext context, [FromQuery] string appId)
        {
            await HttpContext.SignOutAsync();
            return Redirect(QueryHelpers.AddQueryString(Request.PathBase + CookieAuthenticationDefaults.LoginPath, "AppId", appId ?? context.AppId));
        }
        #endregion

        #region Mobile Login
        /// <summary>
        /// 短信验证登陆方法
        /// </summary>
        /// <param name="provider"></param>
        /// <param name="loginService"></param>
        /// <param name="phone"></param>
        /// <param name="code"></param>
        /// <returns></returns>
        [HttpPost()]
        public async Task<IActionResult> Mobile(string phone, string code,
            [FromServices] ISMSProvider provider,
            [FromServices] ILogin loginService,
            [FromServices] IUser userService,
            [FromServices] BootstrapAppContext context)
        {
            if (string.IsNullOrEmpty(phone) || string.IsNullOrEmpty(code)) return RedirectLogin();

            var auth = provider.Validate(phone, code);
            await loginService.Log(phone, auth);
            if (auth)
            {
                userService.TryCreateUserByPhone(phone, context.AppId, provider.Options.Roles);
            }
            return auth ? await SignInAsync(phone, false, 0, MobileSchema) : RedirectLogin();
        }
        #endregion

        ///// <summary>
        ///// Accesses the denied.
        ///// </summary>
        ///// <returns>The denied.</returns>
        //[ResponseCache(Duration = 600)]
        //[HttpGet]
        //public ActionResult AccessDenied() => View("Error", ErrorModel.CreateById(403));

        ///// <summary>
        ///// Gitee 认证
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public IActionResult Gitee([FromServices] IConfiguration config)
        //{
        //    var enabled = config.GetValue($"{nameof(GiteeOptions)}:Enabled", false);
        //    return Challenge(enabled ? GiteeDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme);
        //}

        ///// <summary>
        ///// GitHub 认证
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public IActionResult GitHub([FromServices] IConfiguration config)
        //{
        //    var enabled = config.GetValue($"{nameof(GitHubOptions)}:Enabled", false);
        //    return Challenge(enabled ? GitHubDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme);
        //}

        ///// <summary>
        ///// Tencent 认证
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public IActionResult Tencent([FromServices] IConfiguration config)
        //{
        //    var enabled = config.GetValue($"{nameof(TencentOptions)}:Enabled", false);
        //    return Challenge(enabled ? TencentDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme);
        //}

        ///// <summary>
        ///// Alipay 认证
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public IActionResult Alipay([FromServices] IConfiguration config)
        //{
        //    var enabled = config.GetValue($"{nameof(AlipayOptions)}:Enabled", false);
        //    return Challenge(enabled ? AlipayDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme);
        //}

        ///// <summary>
        ///// WeChat 认证
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public IActionResult WeChat([FromServices] IConfiguration config)
        //{
        //    var enabled = config.GetValue($"{nameof(WeChatOptions)}:Enabled", false);
        //    return Challenge(enabled ? WeChatDefaults.AuthenticationScheme : CookieAuthenticationDefaults.AuthenticationScheme);
        //}
        ///// <summary>
        ///// 系统锁屏界面
        ///// </summary>
        ///// <returns></returns>
        //[HttpGet]
        //public async Task<ActionResult> Lock()
        //{
        //    if (!User.Identity!.IsAuthenticated) return Login();

        //    var authenticationType = User.Identity.AuthenticationType;
        //    await HttpContext.SignOutAsync();
        //    var urlReferrer = Request.Headers["Referer"].FirstOrDefault();
        //    if (urlReferrer?.Contains("/Pages", StringComparison.OrdinalIgnoreCase) ?? false) urlReferrer = "/Pages";
        //    return View(new LockModel(User.Identity.Name)
        //    {
        //        AuthenticationType = authenticationType,
        //        ReturnUrl = WebUtility.UrlEncode(string.IsNullOrEmpty(urlReferrer) ? CookieAuthenticationDefaults.LoginPath.Value : urlReferrer)
        //    });
        //}

        ///// <summary>
        ///// 系统锁屏界面
        ///// </summary>
        ///// <param name="provider"></param>
        ///// <param name="userName"></param>
        ///// <param name="password"></param>
        ///// <param name="authType"></param>
        ///// <returns></returns>
        //[HttpPost]
        //[IgnoreAntiforgeryToken]
        //public Task<IActionResult> Lock([FromServices] ISMSProvider provider, string userName, string password, string authType)
        //{
        //    // 根据不同的登陆方式
        //    Task<IActionResult> ret;
        //    if (authType == MobileSchema) ret = Mobile(provider, userName, password);
        //    else ret = Login(userName, password, string.Empty);
        //    return ret;
        //}
    }
}
