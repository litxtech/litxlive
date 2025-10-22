import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Get ban types
export const adminBansGetTypesRoute = adminProcedure
  .query(async () => {
    console.log("[Bans] Getting ban types");

    try {
      const result = await pool.query(`
        SELECT 
          id, name, description, duration_hours, severity_level, is_active
        FROM ban_types
        WHERE is_active = true
        ORDER BY severity_level ASC, name ASC
      `);

      return result.rows;
    } catch (error) {
      console.error("[Bans] Get types error:", error);
      throw new Error("Failed to get ban types");
    }
  });

// Create ban type
export const adminBansCreateTypeRoute = adminProcedure
  .input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    duration_hours: z.number().nullable(),
    severity_level: z.number().min(1).max(5).default(1)
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Bans] Creating ban type:", input.name);

    try {
      const result = await pool.query(`
        INSERT INTO ban_types (name, description, duration_hours, severity_level)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [input.name, input.description || null, input.duration_hours, input.severity_level]);

      return { success: true, ban_type_id: result.rows[0].id };
    } catch (error) {
      console.error("[Bans] Create type error:", error);
      throw new Error("Failed to create ban type");
    }
  });

// Ban user
export const adminBansBanUserRoute = adminProcedure
  .input(z.object({
    user_id: z.string().uuid(),
    ban_type_id: z.string().uuid(),
    reason: z.string().min(1),
    duration_hours: z.number().nullable().optional(),
    requires_approval: z.boolean().default(false)
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Bans] Banning user:", input.user_id);

    try {
      // Check if user is already banned
      const existingBan = await pool.query(`
        SELECT id FROM user_bans 
        WHERE user_id = $1 AND is_active = true
      `, [input.user_id]);

      if (existingBan.rows.length > 0) {
        throw new Error("User is already banned");
      }

      // If requires approval, create approval request
      if (input.requires_approval) {
        const approvalResult = await pool.query(`
          INSERT INTO admin_approvals (
            request_type, requester_id, request_data, status
          ) VALUES ($1, $2, $3, 'pending')
          RETURNING id
        `, [
          'user_ban',
          ctx.user?.id,
          JSON.stringify({
            user_id: input.user_id,
            ban_type_id: input.ban_type_id,
            reason: input.reason,
            duration_hours: input.duration_hours
          })
        ]);

        return { success: true, requires_approval: true, approval_id: approvalResult.rows[0].id };
      }

      // Direct ban
      const duration = input.duration_hours || null;
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

      await pool.query(`
        INSERT INTO user_bans (
          user_id, ban_type_id, admin_user_id, reason, 
          duration_hours, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [
        input.user_id,
        input.ban_type_id,
        ctx.user?.id,
        input.reason,
        duration,
        expiresAt
      ]);

      return { success: true, requires_approval: false };
    } catch (error) {
      console.error("[Bans] Ban user error:", error);
      throw new Error("Failed to ban user");
    }
  });

// Unban user
export const adminBansUnbanUserRoute = adminProcedure
  .input(z.object({
    user_id: z.string().uuid(),
    reason: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Bans] Unbanning user:", input.user_id);

    try {
      await pool.query(`
        UPDATE user_bans 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = $1 AND is_active = true
      `, [input.user_id]);

      return { success: true };
    } catch (error) {
      console.error("[Bans] Unban user error:", error);
      throw new Error("Failed to unban user");
    }
  });

// Get user bans
export const adminBansGetUserBansRoute = adminProcedure
  .input(z.object({
    user_id: z.string().uuid()
  }))
  .query(async ({ input }) => {
    console.log("[Bans] Getting user bans:", input.user_id);

    try {
      const result = await pool.query(`
        SELECT 
          ub.id,
          ub.reason,
          ub.duration_hours,
          ub.is_active,
          ub.banned_at,
          ub.expires_at,
          ub.created_at,
          bt.name as ban_type_name,
          bt.description as ban_type_description,
          bt.severity_level,
          admin_user.user_id as admin_user_id,
          admin_user_info.email as admin_email,
          admin_user_info.raw_user_meta_data->>'full_name' as admin_name
        FROM user_bans ub
        JOIN ban_types bt ON ub.ban_type_id = bt.id
        LEFT JOIN admin_users admin_user ON ub.admin_user_id = admin_user.id
        LEFT JOIN auth.users admin_user_info ON admin_user.user_id = admin_user_info.id
        WHERE ub.user_id = $1
        ORDER BY ub.created_at DESC
      `, [input.user_id]);

      return result.rows;
    } catch (error) {
      console.error("[Bans] Get user bans error:", error);
      throw new Error("Failed to get user bans");
    }
  });

// Get all active bans
export const adminBansGetActiveBansRoute = adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    ban_type_id: z.string().uuid().optional(),
    severity_level: z.number().optional()
  }))
  .query(async ({ input }) => {
    console.log("[Bans] Getting active bans");

    try {
      let whereConditions = ['ub.is_active = true'];
      let queryParams: any[] = [];
      let paramCount = 0;

      if (input.ban_type_id) {
        paramCount++;
        whereConditions.push(`ub.ban_type_id = $${paramCount}`);
        queryParams.push(input.ban_type_id);
      }

      if (input.severity_level) {
        paramCount++;
        whereConditions.push(`bt.severity_level = $${paramCount}`);
        queryParams.push(input.severity_level);
      }

      const offset = (input.page - 1) * input.limit;

      const result = await pool.query(`
        SELECT 
          ub.id,
          ub.user_id,
          ub.reason,
          ub.duration_hours,
          ub.banned_at,
          ub.expires_at,
          bt.name as ban_type_name,
          bt.severity_level,
          u.email as user_email,
          u.raw_user_meta_data->>'full_name' as user_name,
          admin_user_info.email as admin_email,
          admin_user_info.raw_user_meta_data->>'full_name' as admin_name
        FROM user_bans ub
        JOIN ban_types bt ON ub.ban_type_id = bt.id
        JOIN auth.users u ON ub.user_id = u.id
        LEFT JOIN admin_users admin_user ON ub.admin_user_id = admin_user.id
        LEFT JOIN auth.users admin_user_info ON admin_user.user_id = admin_user_info.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ub.banned_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, input.limit, offset]);

      return result.rows;
    } catch (error) {
      console.error("[Bans] Get active bans error:", error);
      throw new Error("Failed to get active bans");
    }
  });

// Get ban statistics
export const adminBansGetStatsRoute = adminProcedure
  .query(async () => {
    console.log("[Bans] Getting ban statistics");

    try {
      // Active bans count
      const activeBansResult = await pool.query(`
        SELECT COUNT(*) as active_bans FROM user_bans WHERE is_active = true
      `);

      // Bans by type
      const bansByTypeResult = await pool.query(`
        SELECT 
          bt.name as ban_type,
          bt.severity_level,
          COUNT(*) as count
        FROM user_bans ub
        JOIN ban_types bt ON ub.ban_type_id = bt.id
        WHERE ub.is_active = true
        GROUP BY bt.name, bt.severity_level
        ORDER BY bt.severity_level DESC
      `);

      // Recent bans (last 30 days)
      const recentBansResult = await pool.query(`
        SELECT 
          DATE(ub.banned_at) as date,
          COUNT(*) as count
        FROM user_bans ub
        WHERE ub.banned_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(ub.banned_at)
        ORDER BY date DESC
      `);

      return {
        active_bans: parseInt(activeBansResult.rows[0].active_bans),
        bans_by_type: bansByTypeResult.rows,
        recent_bans: recentBansResult.rows
      };
    } catch (error) {
      console.error("[Bans] Get stats error:", error);
      throw new Error("Failed to get ban statistics");
    }
  });
