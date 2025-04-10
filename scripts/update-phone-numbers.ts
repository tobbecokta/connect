import supabase from '../src/services/supabase';

async function updatePhoneNumbers() {
  try {
    // Delete the old Default Device entry
    await supabase
      .from('phone_numbers')
      .delete()
      .eq('id', 'f5da4685-752a-4176-95f9-39cf82c761a5');

    // Ensure Microcement.se is set as default
    await supabase
      .from('phone_numbers')
      .update({ is_default: true })
      .eq('id', '23a66d52-5472-43d6-adcc-c05f9f02a461');

    console.log('Successfully updated phone numbers');
  } catch (error) {
    console.error('Error updating phone numbers:', error);
  }
}

updatePhoneNumbers(); 