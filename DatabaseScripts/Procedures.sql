﻿SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Drop PROCEDURE Proc_DeleteUsers
GO
-- =============================================
-- Author:		Argo Zhang
-- Create date: 2016-09-06
-- Description:	
-- =============================================
Create PROCEDURE Proc_DeleteUsers
	-- Add the parameters for the stored procedure here
	@ids varchar(max)
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	declare @sql varchar(max)
	set @sql = 'Delete from UserRole where UserID in (' + @ids + ');'
	set @sql += 'delete from UserGroup where UserID in (' + @ids + ');'
	set @sql += 'delete from Users where ID in (' + @ids + ');'
	exec(@sql)
END
GO

Drop PROCEDURE Proc_DeleteRoles
GO
-- =============================================
-- Author:		LiuChun
-- Create date: 2016-11-07
-- Description:	
-- =============================================
Create PROCEDURE Proc_DeleteRoles
	-- Add the parameters for the stored procedure here
	@ids varchar(max)
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	declare @sql varchar(max)
	set @sql = 'delete from UserRole where RoleID in (' + @ids + ');'
	set @sql += 'delete from RoleGroup where RoleID in (' + @ids + ');'
	set @sql += 'delete from NavigationRole where RoleID in (' + @ids + ');'
	set @sql += 'delete from Roles where ID in (' + @ids + ');'
	exec(@sql)
END
GO


Drop PROCEDURE Proc_DeleteGroups
GO
-- =============================================
-- Author:		LiuChun
-- Create date: 2016-11-07
-- Description:	
-- =============================================
Create PROCEDURE Proc_DeleteGroups
	-- Add the parameters for the stored procedure here
	@ids varchar(max)
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	declare @sql varchar(max)
	set @sql = 'delete from UserGroup where GroupID in (' + @ids + ');'
	set @sql += 'delete from RoleGroup where GroupID in (' + @ids + ');'
	set @sql += 'delete from Groups where ID in (' + @ids + ');'
	exec(@sql)
END
GO

Drop PROCEDURE Proc_DeleteMenus
GO
-- =============================================
-- Author:		LiuChun
-- Create date: 2016-11-07
-- Description:	
-- =============================================
Create PROCEDURE Proc_DeleteMenus
	-- Add the parameters for the stored procedure here
	@ids varchar(max)
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	declare @sql varchar(max)
	set @sql = 'delete from NavigationRole where NavigationID in (' + @ids + ');'
	set @sql += 'delete from Navigations where ID in (' + @ids + ');'
	exec(@sql)
END
GO

Drop PROCEDURE Proc_RetrieveMenus
GO
-- =============================================
-- Author:		Argo Zhang
-- Create date: 2016-11-08
-- Description:	
-- =============================================
Create PROCEDURE Proc_RetrieveMenus
	-- Add the parameters for the stored procedure here
	@userName varchar(50) = null
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	if @userName = '' or @userName is null
		select n.*, d.Name as CategoryName, ln.Name as ParentName 
		from Navigations n inner join Dicts d on n.Category = d.Code and d.Category = N'菜单' and d.Define = 0 
		left join Navigations ln on n.ParentId = ln.ID
	else
		select n.*, d.Name as CategoryName, ln.Name as ParentName 
		from Navigations n inner join Dicts d on n.Category = d.Code and d.Category = N'菜单' and d.Define = 0 
		left join Navigations ln on n.ParentId = ln.ID
		inner join (
			select nr.NavigationID from Users u 
			inner join UserRole ur on ur.UserID = u.ID 
			inner join NavigationRole nr on nr.RoleID = ur.RoleID
			where u.UserName = @userName
			union
			select nr.NavigationID from Users u 
			inner join UserGroup ug on u.ID = ug.UserID
			inner join RoleGroup rg on rg.GroupID = ug.GroupID 
			inner join NavigationRole nr on nr.RoleID = rg.RoleID
			where u.UserName = @userName
			union
			select n.ID from Navigations n
			where EXISTS (select UserName from Users u 
				inner join UserRole ur on u.ID = ur.UserID
				inner join Roles r on ur.RoleID = r.ID
				where u.UserName = @userName and r.RoleName = N'Administrators'
			)
		) nav on n.ID = nav.NavigationID
END
GO

/****** Object:  StoredProcedure [dbo].[Proc_SaveUsers]    Script Date: 11/11/2016 08:51:44 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

Drop PROCEDURE Proc_SaveUsers
GO
-- =============================================
-- Author:		LiuChun
-- Create date: 2016-11-10
-- Description:	
-- =============================================
CREATE PROCEDURE [dbo].[Proc_SaveUsers]
	-- Add the parameters for the stored procedure here
	@id int,
	@userName varchar(50),
	@password varchar(50),
	@passSalt varchar(50),
	@displayName nvarchar(50),
	@approvedBy varchar(50) = null,
	@description nvarchar(500),
	@rejectedBy varchar(50) = null,
	@rejectedReason nvarchar(500) = null,
	@userStatus int = 0 --0表示管理员创建 1标示用户注册 2标示管理员批复
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	if @userStatus = 2
		begin
			if @approvedBy is not null
				update Users set ApprovedTime = GETDATE(), ApprovedBy = @approvedBy where ID = @id
			else
				update Users set RejectedTime = GETDATE(), RejectedBy = @rejectedBy, RejectedReason = @rejectedReason where ID = @id
		end
	else 
		begin
			declare @approveTime datetime = null
			if @userStatus = 0 set @approveTime = GETDATE() 
			if(@id = 0 and not exists (select 1 from Users Where UserName = @userName))
				Insert Into Users (UserName, [Password], PassSalt, DisplayName, RegisterTime, ApprovedTime, [Description]) values (@userName, @password, @passSalt, @displayName, GETDATE(), @approveTime, @description)
			else 
				Update Users set [Password] = @password, PassSalt = @passSalt, DisplayName = @displayName where ID = @id
		end
END
GO

Drop PROCEDURE Proc_ProcessRegisterUser
GO
-- =============================================
-- Author:		XiaTiantian
-- Create date: 2016-11-10
-- Description:	
-- =============================================
Create PROCEDURE Proc_ProcessRegisterUser
	-- Add the parameters for the stored procedure here
	@id int
	WITH ENCRYPTION
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET XACT_ABORT ON;
    -- Insert statements for procedure here
	update Users set ApprovedTime=GETDATE() where UserName=(select Title from Notifications where ID=@id)
	update Notifications set Status='1',ProcessTime=GETDATE(),ProcessResult='0' where ID=@id
END
GO



