import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Get pending approvals
export const adminApprovalsGetPendingRoute = adminProcedure
  .query(async () => {
    console.log("[Approvals] Getting pending approvals");

    try {
      const result = await pool.query(`
        SELECT 
          aa.id,
          aa.request_type,
          aa.status,
          aa.request_data,
          aa.approval_notes,
          aa.created_at,
          aa.expires_at,
          requester.user_id as requester_user_id,
          requester_user.email as requester_email,
          requester_user.raw_user_meta_data->>'full_name' as requester_name,
          approver.user_id as approver_user_id,
          approver_user.email as approver_email,
          approver_user.raw_user_meta_data->>'full_name' as approver_name
        FROM admin_approvals aa
        LEFT JOIN admin_users requester ON aa.requester_id = requester.id
        LEFT JOIN auth.users requester_user ON requester.user_id = requester_user.id
        LEFT JOIN admin_users approver ON aa.approver_id = approver.id
        LEFT JOIN auth.users approver_user ON approver.user_id = approver_user.id
        WHERE aa.status = 'pending'
        ORDER BY aa.created_at ASC
      `);

      return result.rows;
    } catch (error) {
      console.error("[Approvals] Get pending error:", error);
      throw new Error("Failed to get pending approvals");
    }
  });

// Create approval request
export const adminApprovalsCreateRequestRoute = adminProcedure
  .input(z.object({
    request_type: z.enum(['coin_addition', 'user_ban', 'payment_refund', 'agency_approval', 'content_approval']),
    request_data: z.record(z.string(), z.any()),
    approval_notes: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Approvals] Creating approval request:", input.request_type);

    try {
      // Find an approver (super admin or admin with appropriate permissions)
      const approverResult = await pool.query(`
        SELECT au.id
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        JOIN admin_role_permissions arp ON ar.id = arp.role_id
        JOIN admin_permissions ap ON arp.permission_id = ap.id
        WHERE au.is_active = true
        AND (
          ar.name = 'super_admin' 
          OR (ar.name = 'admin' AND ap.name IN ('approve_payments', 'manage_users', 'approve_agencies', 'approve_content'))
        )
        AND au.user_id != $1
        ORDER BY ar.name = 'super_admin' DESC
        LIMIT 1
      `, [ctx.user?.id]);

      if (approverResult.rows.length === 0) {
        throw new Error("No approver found");
      }

      const approverId = approverResult.rows[0].id;

      // Create approval request
      const result = await pool.query(`
        INSERT INTO admin_approvals (
          request_type, requester_id, approver_id, 
          request_data, approval_notes, status
        ) VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id
      `, [
        input.request_type,
        ctx.user?.id,
        approverId,
        JSON.stringify(input.request_data),
        input.approval_notes || null
      ]);

      return { success: true, approval_id: result.rows[0].id };
    } catch (error) {
      console.error("[Approvals] Create request error:", error);
      throw new Error("Failed to create approval request");
    }
  });

// Approve or reject request
export const adminApprovalsProcessRequestRoute = adminProcedure
  .input(z.object({
    approval_id: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    approval_notes: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Approvals] Processing approval:", input.approval_id, input.status);

    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get approval details
        const approvalResult = await client.query(`
          SELECT * FROM admin_approvals 
          WHERE id = $1 AND status = 'pending'
        `, [input.approval_id]);

        if (approvalResult.rows.length === 0) {
          throw new Error("Approval not found or already processed");
        }

        const approval = approvalResult.rows[0];

        // Update approval status
        await client.query(`
          UPDATE admin_approvals 
          SET status = $1, approval_notes = $2, approved_at = NOW()
          WHERE id = $3
        `, [input.status, input.approval_notes || null, input.approval_id]);

        // Execute the approved action if approved
        if (input.status === 'approved') {
          await executeApprovedAction(client, approval);
        }

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[Approvals] Process request error:", error);
      throw new Error("Failed to process approval request");
    }
  });

// Execute approved action
async function executeApprovedAction(client: any, approval: any) {
  const requestData = approval.request_data;
  
  switch (approval.request_type) {
    case 'coin_addition':
      // Add coins to user
      await client.query(`
        UPDATE users 
        SET coins = coins + $1 
        WHERE unique_id = $2
      `, [requestData.amount, requestData.unique_id]);
      break;
      
    case 'user_ban':
      // Ban user
      await client.query(`
        INSERT INTO user_bans (user_id, ban_type_id, admin_user_id, reason, duration_hours)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        requestData.user_id,
        requestData.ban_type_id,
        approval.requester_id,
        requestData.reason,
        requestData.duration_hours
      ]);
      break;
      
    case 'payment_refund':
      // Process refund (implementation depends on payment system)
      console.log("Processing refund:", requestData);
      break;
      
    case 'agency_approval':
      // Approve agency
      await client.query(`
        UPDATE agency_applications 
        SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
        WHERE id = $2
      `, [approval.requester_id, requestData.agency_id]);
      break;
      
    case 'content_approval':
      // Approve content
      await client.query(`
        UPDATE policies 
        SET status = 'approved', approver_id = $1, published_at = NOW()
        WHERE id = $2
      `, [approval.requester_id, requestData.policy_id]);
      break;
  }
}

// Get approval history
export const adminApprovalsGetHistoryRoute = adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    request_type: z.string().optional(),
    status: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log("[Approvals] Getting approval history");

    try {
      let whereConditions = ['1=1'];
      let queryParams: any[] = [];
      let paramCount = 0;

      if (input.request_type) {
        paramCount++;
        whereConditions.push(`request_type = $${paramCount}`);
        queryParams.push(input.request_type);
      }

      if (input.status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(input.status);
      }

      const offset = (input.page - 1) * input.limit;

      const result = await pool.query(`
        SELECT 
          aa.id,
          aa.request_type,
          aa.status,
          aa.request_data,
          aa.approval_notes,
          aa.created_at,
          aa.approved_at,
          requester_user.email as requester_email,
          requester_user.raw_user_meta_data->>'full_name' as requester_name,
          approver_user.email as approver_email,
          approver_user.raw_user_meta_data->>'full_name' as approver_name
        FROM admin_approvals aa
        LEFT JOIN admin_users requester ON aa.requester_id = requester.id
        LEFT JOIN auth.users requester_user ON requester.user_id = requester_user.id
        LEFT JOIN admin_users approver ON aa.approver_id = approver.id
        LEFT JOIN auth.users approver_user ON approver.user_id = approver_user.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY aa.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, input.limit, offset]);

      return result.rows;
    } catch (error) {
      console.error("[Approvals] Get history error:", error);
      throw new Error("Failed to get approval history");
    }
  });
