-- ============================================================================
-- Agenda item "section" / track label (docs/02 §3.8, design GuestEventDetail Schedule):
-- the editable grouping shown on each agenda line in the event Schedule view
-- (e.g. Main Stage, Workshop, Break, Social, Check-in). Previously the view derived
-- this from the title; it is now a real, organizer-set field so the form matches the
-- view. Optional free text. Forward-only, additive.
-- ============================================================================

ALTER TABLE agenda_item ADD COLUMN section varchar(60);
