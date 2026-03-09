
-- Add DELETE policy for payment_installments so we can recreate mismatched installments
CREATE POLICY "Anon users can delete payment_installments"
ON public.payment_installments
FOR DELETE
TO anon
USING (true);

CREATE POLICY "Authenticated users can delete payment_installments"
ON public.payment_installments
FOR DELETE
TO authenticated
USING (true);
