-- Add DOCUMENT_PURGED action to admin_audit_log
ALTER TABLE public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_action_check
  CHECK (action IN (
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
    'APPLICATION_EXPIRED',
    'APPLICATION_RESUBMITTED',
    'DOCUMENT_VIEWED',
    'CHECKLIST_UPDATED',
    'LITERA_CONFIG_UPDATED',
    'EMAIL_RESENT',
    'SWEEP_FAILED',
    'DOCUMENT_PURGED'
  ));
