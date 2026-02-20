import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";

// GET - Check if current user is admin and get admin profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { isAdmin: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({
        isAdmin: false,
        error: "Not an admin user",
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
      });
    }

    // Check if user has an AdminUser profile
    const adminProfileResult = await db.execute({
      sql: `SELECT 
        au.id,
        au.userId,
        au.role as adminRole,
        au.customPermissions,
        au.isActive,
        au.lastAdminActionAt,
        au.twoFactorEnabled,
        au.createdAt
      FROM AdminUser au
      WHERE au.userId = ? AND au.isActive = 1`,
      args: [session.user.id],
    });

    if (adminProfileResult.rows.length === 0) {
      // User has ADMIN role but no AdminUser profile
      // This could be a super admin or legacy admin
      return NextResponse.json({
        isAdmin: true,
        hasAdminProfile: false,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          status: session.user.status,
        },
        message: "Admin user without AdminUser profile. Please create an admin profile.",
      });
    }

    const adminProfile = adminProfileResult.rows[0];

    return NextResponse.json({
      isAdmin: true,
      hasAdminProfile: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        status: session.user.status,
      },
      adminProfile: {
        id: adminProfile.id as string,
        adminRole: adminProfile.adminRole as string,
        customPermissions: adminProfile.customPermissions 
          ? JSON.parse(adminProfile.customPermissions as string) 
          : null,
        isActive: Boolean(adminProfile.isActive),
        lastAdminActionAt: adminProfile.lastAdminActionAt as string | null,
        twoFactorEnabled: Boolean(adminProfile.twoFactorEnabled),
        createdAt: adminProfile.createdAt as string,
      },
      permissions: getPermissionsForRole(adminProfile.adminRole as string),
    });
  } catch (error) {
    console.error("Admin auth check error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}

// Helper function to get permissions based on role
function getPermissionsForRole(role: string): Record<string, boolean> {
  const rolePermissions: Record<string, Record<string, boolean>> = {
    SUPER_ADMIN: {
      canManageUsers: true,
      canManageAdmins: true,
      canManageContracts: true,
      canManagePayments: true,
      canManageSettings: true,
      canViewLogs: true,
      canImpersonate: true,
      canModifyFees: true,
      canSuspendUsers: true,
      canVerifyKyc: true,
      canAccessAnalytics: true,
    },
    ADMIN: {
      canManageUsers: true,
      canManageAdmins: false,
      canManageContracts: true,
      canManagePayments: true,
      canManageSettings: false,
      canViewLogs: true,
      canImpersonate: false,
      canModifyFees: false,
      canSuspendUsers: true,
      canVerifyKyc: true,
      canAccessAnalytics: true,
    },
    SUPPORT: {
      canManageUsers: true,
      canManageAdmins: false,
      canManageContracts: false,
      canManagePayments: false,
      canManageSettings: false,
      canViewLogs: true,
      canImpersonate: false,
      canModifyFees: false,
      canSuspendUsers: false,
      canVerifyKyc: false,
      canAccessAnalytics: false,
    },
    MODERATOR: {
      canManageUsers: false,
      canManageAdmins: false,
      canManageContracts: false,
      canManagePayments: false,
      canManageSettings: false,
      canViewLogs: false,
      canImpersonate: false,
      canModifyFees: false,
      canSuspendUsers: false,
      canVerifyKyc: false,
      canAccessAnalytics: false,
    },
    ANALYST: {
      canManageUsers: false,
      canManageAdmins: false,
      canManageContracts: false,
      canManagePayments: false,
      canManageSettings: false,
      canViewLogs: true,
      canImpersonate: false,
      canModifyFees: false,
      canSuspendUsers: false,
      canVerifyKyc: false,
      canAccessAnalytics: true,
    },
  };

  return rolePermissions[role] || rolePermissions.ANALYST;
}
