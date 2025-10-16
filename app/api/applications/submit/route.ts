import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('[Applications] Submit request:', {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      application_purpose: body.application_purpose,
      hasDocuments: !!body.documents,
      documentCount: Object.keys(body.documents || {}).length
    });

    // Validate required fields
    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone', 
      'country', 'city', 'address', 'application_purpose',
      'kvkk_accepted', 'privacy_accepted', 'terms_accepted', 'signature_name'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
    return new Response(JSON.stringify({
      success: false,
      message: `Missing required field: ${field}`
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
      }
    }

    if (!body.kvkk_accepted || !body.privacy_accepted || !body.terms_accepted) {
      return new Response(JSON.stringify({
        success: false,
        message: 'All terms must be accepted'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert application into database
    const { data, error } = await supabase
      .from('agency_applications')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        country: body.country,
        city: body.city,
        address: body.address,
        birth_date: body.birth_date,
        national_id: body.national_id,
        application_purpose: body.application_purpose,
        category_tags: body.category_tags || [],
        company_type: body.company_type,
        company_name: body.company_name,
        tax_number: body.tax_number,
        company_address: body.company_address,
        website: body.website,
        hometown: body.hometown,
        documents: body.documents || {},
        id_document_type: body.idDocumentType,
        selfie_url: body.documents?.selfie,
        id_front_url: body.documents?.idFront,
        id_back_url: body.documents?.idBack,
        signature_name: body.signature_name,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Applications] Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to save application'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Applications] Application saved:', data.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Application submitted successfully',
      applicationId: data.id
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Applications] Submit error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
