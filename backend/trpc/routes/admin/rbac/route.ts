import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Get current admin user with role and permissions
export const adminRBACGetCurrentUserRoute = adminProcedure
  .query(async ({ ctx }) => {
    console.log("[RBAC] Getting current user:", ctx.user?.id);

    try {
      const result = await pool.query(`
        SELECT 
          au.id,
          au.user_id,
          au.is_active,
          au.last_login,
          au.created_at,
          ar.id as role_id,
          ar.name as role_name,
          ar.description as role_description,
          ar.is_system_role
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.user_id = $1 AND au.is_active = true
      `, [ctx.user?.id]);

      if (result.rows.length === 0) {
        throw new Error("Admin user not found");
      }

      const user = result.rows[0];

      // Get permissions for this role
      const permissionsResult = await pool.query(`
        SELECT 
          ap.id,
          ap.name,
          ap.description,
          ap.category
        FROM admin_permissions ap
        JOIN admin_role_permissions arp ON ap.id = arp.permission_id
        WHERE arp.role_id = $1
        ORDER BY ap.category, ap.name
      `, [user.role_id]);

      return {
        id: user.id,
        user_id: user.user_id,
        role: {
          id: user.role_id,
          name: user.role_name,
          description: user.role_description,
          is_system_role: user.is_system_role,
          permissions: permissionsResult.rows
        },
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
      };
    } catch (error) {
      console.error("[RBAC] Get current user error:", error);
      throw new Error("Failed to get current user");
    }
  });

// Get all permissions
export const adminRBACGetPermissionsRoute = adminProcedure
  .query(async () => {
    console.log("[RBAC] Getting all permissions");

    try {
      const result = await pool.query(`
        SELECT 
          id,
          name,
          description,
          category
        FROM admin_permissions
        ORDER BY category, name
      `);

      return result.rows;
    } catch (error) {
      console.error("[RBAC] Get permissions error:", error);
      throw new Error("Failed to get permissions");
    }
  });

// Get all roles
export const adminRBACGetRolesRoute = adminProcedure
  .query(async () => {
    console.log("[RBAC] Getting all roles");

    try {
      const result = await pool.query(`
        SELECT 
          ar.id,
          ar.name,
          ar.description,
          ar.is_system_role,
          ar.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ap.id,
                'name', ap.name,
                'description', ap.description,
                'category', ap.category
              )
            ) FILTER (WHERE ap.id IS NOT NULL),
            '[]'::json
          ) as permissions
        FROM admin_roles ar
        LEFT JOIN admin_role_permissions arp ON ar.id = arp.role_id
        LEFT JOIN admin_permissions ap ON arp.permission_id = ap.id
        GROUP BY ar.id, ar.name, ar.description, ar.is_system_role, ar.created_at
        ORDER BY ar.name
      `);

      return result.rows;
    } catch (error) {
      console.error("[RBAC] Get roles error:", error);
      throw new Error("Failed to get roles");
    }
  });

// Create new role
export const adminRBACCreateRoleRoute = adminProcedure
  .input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    permission_ids: z.array(z.string().uuid())
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[RBAC] Creating role:", input.name);

    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create role
        const roleResult = await client.query(`
          INSERT INTO admin_roles (name, description)
          VALUES ($1, $2)
          RETURNING id
        `, [input.name, input.description || null]);

        const roleId = roleResult.rows[0].id;

        // Add permissions
        if (input.permission_ids.length > 0) {
          const permissionValues = input.permission_ids.map(permissionId => 
            `('${roleId}', '${permissionId}')`
          ).join(',');

          await client.query(`
            INSERT INTO admin_role_permissions (role_id, permission_id)
            VALUES ${permissionValues}
          `);
        }

        await client.query('COMMIT');

        // Log the action
        await client.query(`
          INSERT INTO admin_audit_logs (admin_user_id, action, resource_type, resource_id, new_values)
          VALUES ($1, 'create', 'role', $2, $3)
        `, [ctx.user?.id, roleId, JSON.stringify({ name: input.name, description: input.description })]);

        return { success: true, role_id: roleId };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[RBAC] Create role error:", error);
      throw new Error("Failed to create role");
    }
  });

// Update role permissions
export const adminRBACUpdateRolePermissionsRoute = adminProcedure
  .input(z.object({
    role_id: z.string().uuid(),
    permission_ids: z.array(z.string().uuid())
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[RBAC] Updating role permissions:", input.role_id);

    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Remove existing permissions
        await client.query(`
          DELETE FROM admin_role_permissions 
          WHERE role_id = $1
        `, [input.role_id]);

        // Add new permissions
        if (input.permission_ids.length > 0) {
          const permissionValues = input.permission_ids.map(permissionId => 
            `('${input.role_id}', '${permissionId}')`
          ).join(',');

          await client.query(`
            INSERT INTO admin_role_permissions (role_id, permission_id)
            VALUES ${permissionValues}
          `);
        }

        await client.query('COMMIT');

        // Log the action
        await client.query(`
          INSERT INTO admin_audit_logs (admin_user_id, action, resource_type, resource_id, new_values)
          VALUES ($1, 'update', 'role', $2, $3)
        `, [ctx.user?.id, input.role_id, JSON.stringify({ permission_ids: input.permission_ids })]);

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[RBAC] Update role permissions error:", error);
      throw new Error("Failed to update role permissions");
    }
  });

// Assign role to user
export const adminRBACAssignRoleRoute = adminProcedure
  .input(z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log("[RBAC] Assigning role to user:", input.user_id);

    try {
      const result = await pool.query(`
        INSERT INTO admin_users (user_id, role_id, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          role_id = $2,
          is_active = true,
          updated_at = NOW()
        RETURNING id
      `, [input.user_id, input.role_id]);

      // Log the action
      await pool.query(`
        INSERT INTO admin_audit_logs (admin_user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, 'update', 'admin_user', $2, $3)
      `, [ctx.user?.id, result.rows[0].id, JSON.stringify({ role_id: input.role_id })]);

      return { success: true };
    } catch (error) {
      console.error("[RBAC] Assign role error:", error);
      throw new Error("Failed to assign role");
    }
  });
