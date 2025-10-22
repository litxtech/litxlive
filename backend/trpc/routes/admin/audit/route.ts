import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Get audit logs with filtering
export const adminAuditGetLogsRoute = adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    action: z.string().optional(),
    resource_type: z.string().optional(),
    admin_user_id: z.string().uuid().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }))
  .query(async ({ input }) => {
    console.log("[Audit] Getting audit logs:", input);

    try {
      let whereConditions = ['1=1'];
      let queryParams: any[] = [];
      let paramCount = 0;

      if (input.action) {
        paramCount++;
        whereConditions.push(`action = $${paramCount}`);
        queryParams.push(input.action);
      }

      if (input.resource_type) {
        paramCount++;
        whereConditions.push(`resource_type = $${paramCount}`);
        queryParams.push(input.resource_type);
      }

      if (input.admin_user_id) {
        paramCount++;
        whereConditions.push(`admin_user_id = $${paramCount}`);
        queryParams.push(input.admin_user_id);
      }

      if (input.start_date) {
        paramCount++;
        whereConditions.push(`created_at >= $${paramCount}`);
        queryParams.push(input.start_date);
      }

      if (input.end_date) {
        paramCount++;
        whereConditions.push(`created_at <= $${paramCount}`);
        queryParams.push(input.end_date);
      }

      const offset = (input.page - 1) * input.limit;

      // Get total count
      const countResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM admin_audit_logs
        WHERE ${whereConditions.join(' AND ')}
      `, queryParams);

      // Get logs with admin user info
      const logsResult = await pool.query(`
        SELECT 
          aal.id,
          aal.action,
          aal.resource_type,
          aal.resource_id,
          aal.old_values,
          aal.new_values,
          aal.ip_address,
          aal.user_agent,
          aal.created_at,
          au.user_id,
          u.email as admin_email,
          u.raw_user_meta_data->>'full_name' as admin_name,
          ar.name as role_name
        FROM admin_audit_logs aal
        LEFT JOIN admin_users au ON aal.admin_user_id = au.id
        LEFT JOIN auth.users u ON au.user_id = u.id
        LEFT JOIN admin_roles ar ON au.role_id = ar.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY aal.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, input.limit, offset]);

      return {
        logs: logsResult.rows,
        total: parseInt(countResult.rows[0].total),
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil(parseInt(countResult.rows[0].total) / input.limit)
      };
    } catch (error) {
      console.error("[Audit] Get logs error:", error);
      throw new Error("Failed to get audit logs");
    }
  });

// Get audit log statistics
export const adminAuditGetStatsRoute = adminProcedure
  .input(z.object({
    days: z.number().min(1).max(365).default(30)
  }))
  .query(async ({ input }) => {
    console.log("[Audit] Getting audit stats for", input.days, "days");

    try {
      // Actions count
      const actionsResult = await pool.query(`
        SELECT 
          action,
          COUNT(*) as count
        FROM admin_audit_logs
        WHERE created_at >= NOW() - INTERVAL '${input.days} days'
        GROUP BY action
        ORDER BY count DESC
      `);

      // Resource types count
      const resourceTypesResult = await pool.query(`
        SELECT 
          resource_type,
          COUNT(*) as count
        FROM admin_audit_logs
        WHERE created_at >= NOW() - INTERVAL '${input.days} days'
        GROUP BY resource_type
        ORDER BY count DESC
      `);

      // Daily activity
      const dailyResult = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM admin_audit_logs
        WHERE created_at >= NOW() - INTERVAL '${input.days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Most active admins
      const adminsResult = await pool.query(`
        SELECT 
          au.user_id,
          u.email as admin_email,
          u.raw_user_meta_data->>'full_name' as admin_name,
          COUNT(*) as action_count
        FROM admin_audit_logs aal
        JOIN admin_users au ON aal.admin_user_id = au.id
        JOIN auth.users u ON au.user_id = u.id
        WHERE aal.created_at >= NOW() - INTERVAL '${input.days} days'
        GROUP BY au.user_id, u.email, u.raw_user_meta_data->>'full_name'
        ORDER BY action_count DESC
        LIMIT 10
      `);

      return {
        actions: actionsResult.rows,
        resource_types: resourceTypesResult.rows,
        daily_activity: dailyResult.rows,
        most_active_admins: adminsResult.rows
      };
    } catch (error) {
      console.error("[Audit] Get stats error:", error);
      throw new Error("Failed to get audit statistics");
    }
  });

// Log an action (internal use)
export const logAuditAction = async (
  adminUserId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await pool.query(`
      INSERT INTO admin_audit_logs (
        admin_user_id, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      adminUserId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      userAgent || null
    ]);
  } catch (error) {
    console.error("[Audit] Log action error:", error);
    // Don't throw - audit logging should not break the main operation
  }
};
