import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Get policies with filtering
export const adminPoliciesGetPoliciesRoute = adminProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    status: z.string().optional(),
    author_id: z.string().uuid().optional(),
    search: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log("[Policies] Getting policies");

    try {
      let whereConditions = ['1=1'];
      let queryParams: any[] = [];
      let paramCount = 0;

      if (input.status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(input.status);
      }

      if (input.author_id) {
        paramCount++;
        whereConditions.push(`author_id = $${paramCount}`);
        queryParams.push(input.author_id);
      }

      if (input.search) {
        paramCount++;
        whereConditions.push(`(title ILIKE $${paramCount} OR content ILIKE $${paramCount})`);
        queryParams.push(`%${input.search}%`);
      }

      const offset = (input.page - 1) * input.limit;

      const result = await pool.query(`
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.content,
          p.version,
          p.status,
          p.published_at,
          p.created_at,
          p.updated_at,
          author.user_id as author_user_id,
          author_user.email as author_email,
          author_user.raw_user_meta_data->>'full_name' as author_name,
          approver.user_id as approver_user_id,
          approver_user.email as approver_email,
          approver_user.raw_user_meta_data->>'full_name' as approver_name
        FROM policies p
        LEFT JOIN admin_users author ON p.author_id = author.id
        LEFT JOIN auth.users author_user ON author.user_id = author_user.id
        LEFT JOIN admin_users approver ON p.approver_id = approver.id
        LEFT JOIN auth.users approver_user ON approver.user_id = approver_user.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY p.updated_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, input.limit, offset]);

      return result.rows;
    } catch (error) {
      console.error("[Policies] Get policies error:", error);
      throw new Error("Failed to get policies");
    }
  });

// Create policy
export const adminPoliciesCreateRoute = adminProcedure
  .input(z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string().min(1),
    status: z.enum(['draft', 'pending_approval']).default('draft')
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Policies] Creating policy:", input.title);

    try {
      // Check if slug exists
      const existingSlug = await pool.query(`
        SELECT id FROM policies WHERE slug = $1
      `, [input.slug]);

      if (existingSlug.rows.length > 0) {
        throw new Error("Slug already exists");
      }

      const result = await pool.query(`
        INSERT INTO policies (title, slug, content, status, author_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [input.title, input.slug, input.content, input.status, ctx.user.id]);

      return { success: true, policy_id: result.rows[0].id };
    } catch (error) {
      console.error("[Policies] Create policy error:", error);
      throw new Error("Failed to create policy");
    }
  });

// Update policy
export const adminPoliciesUpdateRoute = adminProcedure
  .input(z.object({
    policy_id: z.string().uuid(),
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    status: z.enum(['draft', 'pending_approval', 'approved', 'published', 'archived']).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Policies] Updating policy:", input.policy_id);

    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get current policy
        const currentPolicy = await client.query(`
          SELECT * FROM policies WHERE id = $1
        `, [input.policy_id]);

        if (currentPolicy.rows.length === 0) {
          throw new Error("Policy not found");
        }

        const policy = currentPolicy.rows[0];

        // Update policy
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        if (input.title) {
          paramCount++;
          updateFields.push(`title = $${paramCount}`);
          updateValues.push(input.title);
        }

        if (input.content) {
          paramCount++;
          updateFields.push(`content = $${paramCount}`);
          updateValues.push(input.content);
        }

        if (input.status) {
          paramCount++;
          updateFields.push(`status = $${paramCount}`);
          updateValues.push(input.status);
        }

        if (updateFields.length === 0) {
          throw new Error("No fields to update");
        }

        paramCount++;
        updateFields.push(`version = version + 1`);
        updateFields.push(`updated_at = NOW()`);

        await client.query(`
          UPDATE policies 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount + 1}
        `, [...updateValues, input.policy_id]);

        // If status changed to pending_approval, create approval request
        if (input.status === 'pending_approval') {
          await client.query(`
            INSERT INTO admin_approvals (
              request_type, requester_id, request_data, status
            ) VALUES ($1, $2, $3, 'pending')
          `, [
            'content_approval',
            ctx.user.id,
            JSON.stringify({ policy_id: input.policy_id })
          ]);
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
      console.error("[Policies] Update policy error:", error);
      throw new Error("Failed to update policy");
    }
  });

// Approve policy
export const adminPoliciesApproveRoute = adminProcedure
  .input(z.object({
    policy_id: z.string().uuid(),
    approval_notes: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Policies] Approving policy:", input.policy_id);

    try {
      await pool.query(`
        UPDATE policies 
        SET status = 'approved', approver_id = $1, published_at = NOW(), updated_at = NOW()
        WHERE id = $2
      `, [ctx.user.id, input.policy_id]);

      return { success: true };
    } catch (error) {
      console.error("[Policies] Approve policy error:", error);
      throw new Error("Failed to approve policy");
    }
  });

// Publish policy
export const adminPoliciesPublishRoute = adminProcedure
  .input(z.object({
    policy_id: z.string().uuid()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Policies] Publishing policy:", input.policy_id);

    try {
      await pool.query(`
        UPDATE policies 
        SET status = 'published', updated_at = NOW()
        WHERE id = $1 AND status = 'approved'
      `, [input.policy_id]);

      return { success: true };
    } catch (error) {
      console.error("[Policies] Publish policy error:", error);
      throw new Error("Failed to publish policy");
    }
  });

// Get policy by slug (public)
export const adminPoliciesGetBySlugRoute = adminProcedure
  .input(z.object({
    slug: z.string()
  }))
  .query(async ({ input }) => {
    console.log("[Policies] Getting policy by slug:", input.slug);

    try {
      const result = await pool.query(`
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.content,
          p.version,
          p.status,
          p.published_at,
          p.created_at,
          p.updated_at
        FROM policies p
        WHERE p.slug = $1 AND p.status = 'published'
        ORDER BY p.version DESC
        LIMIT 1
      `, [input.slug]);

      if (result.rows.length === 0) {
        throw new Error("Policy not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("[Policies] Get policy by slug error:", error);
      throw new Error("Failed to get policy");
    }
  });

// Get policy versions
export const adminPoliciesGetVersionsRoute = adminProcedure
  .input(z.object({
    policy_id: z.string().uuid()
  }))
  .query(async ({ input }) => {
    console.log("[Policies] Getting policy versions:", input.policy_id);

    try {
      const result = await pool.query(`
        SELECT 
          id,
          title,
          content,
          version,
          status,
          created_at,
          updated_at
        FROM policies
        WHERE id = $1
        ORDER BY version DESC
      `, [input.policy_id]);

      return result.rows;
    } catch (error) {
      console.error("[Policies] Get versions error:", error);
      throw new Error("Failed to get policy versions");
    }
  });

// Archive policy
export const adminPoliciesArchiveRoute = adminProcedure
  .input(z.object({
    policy_id: z.string().uuid()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[Policies] Archiving policy:", input.policy_id);

    try {
      await pool.query(`
        UPDATE policies 
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1
      `, [input.policy_id]);

      return { success: true };
    } catch (error) {
      console.error("[Policies] Archive policy error:", error);
      throw new Error("Failed to archive policy");
    }
  });
