
import { createClient } from '@supabase/supabase-js';

const {
    VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY,
    CRM_NEW_USER_EMAIL,
    CRM_NEW_USER_PASSWORD,
} = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !CRM_NEW_USER_EMAIL || !CRM_NEW_USER_PASSWORD) {
    console.error('Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, CRM_NEW_USER_EMAIL, and CRM_NEW_USER_PASSWORD before running this script.');
    process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function createUser() {
    console.log('Creating user...');

    const { data, error } = await supabase.auth.signUp({
        email: CRM_NEW_USER_EMAIL,
        password: CRM_NEW_USER_PASSWORD,
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created successfully (or email sent):', data.user?.email);
    }
}

createUser();
