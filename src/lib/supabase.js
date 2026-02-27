import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xewgnuijxlsqwrhsoszd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2dudWlqeGxzcXdyaHNvc3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDE0ODksImV4cCI6MjA4Nzc3NzQ4OX0.mkvNHA1W-REGtopMwHwr9CvQ3qHJzCeZYsmQs0YKj4c'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
