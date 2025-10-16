import { Hono } from 'hono';
import { q } from '../lib/db.js';

const r = new Hono();

r.post('/submit', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    
    console.log('[Applications] Received submission:', body);
    
    const {
      first_name,
      last_name,
      phone,
      email,
      country,
      city,
      address,
      birth_date,
      national_id,
      hometown,
      company_type,
      company_name,
      tax_number,
      company_address,
      website,
      application_purpose,
      category_tags,
      instagram_url,
      tiktok_url,
      youtube_url,
      linkedin_url,
      kvkk_accepted,
      privacy_accepted,
      terms_accepted,
      signature_name,
    } = body;

    if (!first_name || !last_name || !phone || !email || !country || !city || !address) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    if (!kvkk_accepted || !privacy_accepted || !terms_accepted || !signature_name) {
      return c.json({ success: false, message: 'All terms must be accepted and signature provided' }, 400);
    }

    const result = await q(
      `INSERT INTO applications (
        first_name, last_name, phone, email, country, city, address,
        birth_date, national_id, hometown,
        company_type, company_name, tax_number, company_address, website,
        application_purpose, category_tags,
        instagram_url, tiktok_url, youtube_url, linkedin_url,
        kvkk_accepted, privacy_accepted, terms_accepted, signature_name,
        status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25,
        'pending', NOW()
      ) RETURNING id`,
      [
        first_name, last_name, phone, email, country, city, address,
        birth_date || null, national_id || null, hometown || null,
        company_type || null, company_name || null, tax_number || null, company_address || null, website || null,
        application_purpose || 'creator', JSON.stringify(category_tags || []),
        instagram_url || null, tiktok_url || null, youtube_url || null, linkedin_url || null,
        kvkk_accepted, privacy_accepted, terms_accepted, signature_name,
      ]
    );

    console.log('[Applications] Submission successful, ID:', result.rows[0]?.id);

    return c.json({ 
      success: true, 
      message: 'Application submitted successfully',
      application_id: result.rows[0]?.id 
    });
  } catch (error) {
    console.error('[Applications] Submission error:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to submit application. Please try again.' 
    }, 500);
  }
});

r.get('/list', async (c) => {
  try {
    const result = await q(
      `SELECT id, first_name, last_name, email, phone, country, city, 
              application_purpose, status, created_at
       FROM applications
       ORDER BY created_at DESC
       LIMIT 100`
    );

    return c.json({ success: true, applications: result.rows });
  } catch (error) {
    console.error('[Applications] List error:', error);
    return c.json({ success: false, message: 'Failed to fetch applications' }, 500);
  }
});

r.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await q(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Application not found' }, 404);
    }

    return c.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('[Applications] Get error:', error);
    return c.json({ success: false, message: 'Failed to fetch application' }, 500);
  }
});

r.put('/:id/status', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));
    const { status } = body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return c.json({ success: false, message: 'Invalid status' }, 400);
    }

    await q(
      `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    return c.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('[Applications] Status update error:', error);
    return c.json({ success: false, message: 'Failed to update status' }, 500);
  }
});

export default r;
