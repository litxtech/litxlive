import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

export const adminModerationReportsRoute = adminProcedure
  .input(
    z.object({
      status: z.enum(["pending", "reviewed", "resolved"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Moderation] Fetching reports:", input);

    try {
      const statusCondition = input.status ? `WHERE r.status = $1` : "";

      const query = `
        SELECT 
          r.id,
          r.reported_user_id,
          r.reporter_user_id,
          r.reason,
          r.description,
          r.status,
          r.created_at,
          ru.email as reported_email,
          ru.raw_user_meta_data->>'full_name' as reported_name,
          rep.email as reporter_email,
          rep.raw_user_meta_data->>'full_name' as reporter_name
        FROM public.reports r
        LEFT JOIN auth.users ru ON ru.id = r.reported_user_id
        LEFT JOIN auth.users rep ON rep.id = r.reporter_user_id
        ${statusCondition}
        ORDER BY r.created_at DESC
        LIMIT $${input.status ? 2 : 1} OFFSET $${input.status ? 3 : 2}
      `;

      const params = input.status
        ? [input.status, input.limit, input.offset]
        : [input.limit, input.offset];

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM public.reports r
        ${statusCondition}
      `;

      const countParams = input.status ? [input.status] : [];
      const countResult = await pool.query(countQuery, countParams);

      console.log(`[Admin Moderation] Found ${result.rows.length} reports`);

      return {
        reports: result.rows.map((row) => ({
          id: row.id,
          reportedUserId: row.reported_user_id,
          reportedUserName: row.reported_name || "Unknown",
          reportedUserEmail: row.reported_email,
          reporterUserId: row.reporter_user_id,
          reporterName: row.reporter_name || "Anonymous",
          reporterEmail: row.reporter_email,
          reason: row.reason,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
        })),
        total: parseInt(countResult.rows[0]?.total || "0"),
      };
    } catch (error) {
      console.error("[Admin Moderation] Error:", error);
      throw new Error("Failed to fetch reports");
    }
  });

export const adminModerationResolveRoute = adminProcedure
  .input(
    z.object({
      reportId: z.string(),
      action: z.enum(["dismiss", "warn", "ban"]),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Moderation] Resolving report:", input);

    try {
      await pool.query(
        `UPDATE public.reports SET status = 'resolved', admin_notes = $1 WHERE id = $2`,
        [input.notes || "", input.reportId]
      );

      if (input.action === "ban") {
        const report = await pool.query(
          `SELECT reported_user_id FROM public.reports WHERE id = $1`,
          [input.reportId]
        );

        if (report.rows[0]) {
          await pool.query(
            `UPDATE auth.users SET banned_until = $1 WHERE id = $2`,
            [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), report.rows[0].reported_user_id]
          );
        }
      }

      console.log("[Admin Moderation] Report resolved successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin Moderation] Resolve error:", error);
      throw new Error("Failed to resolve report");
    }
  });
