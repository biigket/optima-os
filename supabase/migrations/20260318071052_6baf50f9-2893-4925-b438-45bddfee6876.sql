
DO $$
DECLARE
  mock_ids uuid[] := ARRAY[
    'a1000001-aaaa-bbbb-cccc-000000000001',
    'a2000002-aaaa-bbbb-cccc-000000000002',
    'a3000003-aaaa-bbbb-cccc-000000000003',
    'a4000004-aaaa-bbbb-cccc-000000000004'
  ]::uuid[];
BEGIN
  DELETE FROM account_documents WHERE account_id = ANY(mock_ids);
  DELETE FROM opportunity_files WHERE account_id = ANY(mock_ids);
  DELETE FROM opportunity_notes WHERE account_id = ANY(mock_ids);
  DELETE FROM opportunity_stage_history WHERE opportunity_id IN (SELECT id FROM opportunities WHERE account_id = ANY(mock_ids));
  DELETE FROM activities WHERE account_id = ANY(mock_ids);
  DELETE FROM demos WHERE account_id = ANY(mock_ids);
  DELETE FROM payment_installments WHERE quotation_id IN (SELECT id FROM quotations WHERE account_id = ANY(mock_ids));
  DELETE FROM payment_links WHERE quotation_id IN (SELECT id FROM quotations WHERE account_id = ANY(mock_ids));
  DELETE FROM quotations WHERE account_id = ANY(mock_ids);
  DELETE FROM contracts WHERE account_id = ANY(mock_ids);
  DELETE FROM service_tickets WHERE account_id = ANY(mock_ids);
  DELETE FROM visit_plans WHERE account_id = ANY(mock_ids);
  DELETE FROM visit_reports WHERE account_id = ANY(mock_ids);
  DELETE FROM maintenance_records WHERE installation_id IN (SELECT id FROM installations WHERE account_id = ANY(mock_ids));
  DELETE FROM installations WHERE account_id = ANY(mock_ids);
  DELETE FROM contacts WHERE account_id = ANY(mock_ids);
  DELETE FROM opportunities WHERE account_id = ANY(mock_ids);
  DELETE FROM accounts WHERE id = ANY(mock_ids);
END $$;
