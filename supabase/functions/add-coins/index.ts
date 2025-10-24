import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { coins, transactionId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user')
    }

    // Add coins to user's balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        coins: supabase.raw('coins + ?', [coins]),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error('Failed to update coins')
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        type: 'purchase',
        amount: coins,
        currency: 'coins',
        status: 'completed',
        payment_method: 'stripe',
        transaction_id: transactionId,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Transaction record error:', transactionError)
    }

    return new Response(
      JSON.stringify({ success: true, coins }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
