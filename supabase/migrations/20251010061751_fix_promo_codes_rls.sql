/*
  # Fix Promo Codes RLS Policies

  1. Wijzigingen
    - Verwijder bestaande SELECT policy die alleen authenticated users toestaat
    - Voeg nieuwe SELECT policy toe die ook anonieme gebruikers toestaat actieve promo codes te zien
    - Dit is nodig zodat de frontend promocodes kan valideren voordat de gebruiker inlogt
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can view active promo codes" ON promo_codes;

-- Create new policy that allows anonymous users to view active promo codes
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);