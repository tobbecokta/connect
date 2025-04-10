import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script to update phone number names and set default sender
 */
const updatePhoneNumbers = async () => {
  try {
    console.log('Fetching phone numbers...');
    
    // 1. First get all phone numbers to see what we're working with
    const { data: phoneNumbers, error: fetchError } = await supabase
      .from('phone_numbers')
      .select('*');
    
    if (fetchError) throw fetchError;
    console.log('Current phone numbers:', phoneNumbers);
    
    // 2. Update +46766866251 from "Microcement" to "Microcementsil"
    const { data: updatedMicrocementsil, error: error1 } = await supabase
      .from('phone_numbers')
      .update({ device: 'Microcementsil', is_default: false })
      .eq('number', '+46766866251')
      .select();
    
    if (error1) throw error1;
    console.log('Updated Microcementsil:', updatedMicrocementsil);
    
    // 3. Update +46766869915 from "Konkral" to "Microcement.se" and make it default
    const { data: updatedMicrocement, error: error2 } = await supabase
      .from('phone_numbers')
      .update({ device: 'Microcement.se', is_default: true })
      .eq('number', '+46766869915')
      .select();
    
    if (error2) throw error2;
    console.log('Updated Microcement.se:', updatedMicrocement);
    
    // 4. Fetch the updated phone numbers to confirm changes
    const { data: updatedPhoneNumbers, error: finalFetchError } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('is_default', { ascending: false });
    
    if (finalFetchError) throw finalFetchError;
    console.log('Updated phone numbers:', updatedPhoneNumbers);
    
    console.log('Phone number updates completed successfully');
  } catch (error) {
    console.error('Error updating phone numbers:', error);
  }
};

// Execute the function
updatePhoneNumbers(); 