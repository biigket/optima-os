import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OpportunityNote {
  id: string;
  opportunity_id: string;
  account_id: string;
  content: string;
  created_by: string;
  created_at: string;
  parent_id?: string | null;
  is_pinned?: boolean;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

export function useOpportunityNotes(opportunityId: string | undefined) {
  const [notes, setNotes] = useState<OpportunityNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunity_notes')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });
    if (data) setNotes(data as unknown as OpportunityNote[]);
    if (error) console.error('Failed to fetch notes:', error);
    setLoading(false);
  }, [opportunityId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const pinnedIds = new Set(notes.filter(n => n.is_pinned).map(n => n.id));

  const addNote = async (note: Omit<OpportunityNote, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('opportunity_notes')
      .insert({
        opportunity_id: note.opportunity_id,
        account_id: note.account_id,
        content: note.content,
        created_by: note.created_by,
        parent_id: note.parent_id || null,
        is_pinned: note.is_pinned || false,
        file_url: note.file_url || null,
        file_name: note.file_name || null,
        file_size: note.file_size || null,
        file_type: note.file_type || null,
      })
      .select()
      .single();
    if (error) { toast.error('บันทึกโน้ตไม่สำเร็จ'); return null; }
    const newNote = data as unknown as OpportunityNote;
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, content: string) => {
    const { error } = await supabase.from('opportunity_notes').update({ content }).eq('id', id);
    if (error) { toast.error('แก้ไขไม่สำเร็จ'); return; }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('opportunity_notes').delete().eq('id', id);
    if (error) { toast.error('ลบไม่สำเร็จ'); return; }
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const newPinned = !note.is_pinned;
    const { error } = await supabase.from('opportunity_notes').update({ is_pinned: newPinned }).eq('id', id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: newPinned } : n));
  };

  return { notes, loading, pinnedIds, addNote, updateNote, deleteNote, togglePin, refetch: fetchNotes };
}

// Lightweight fetcher for Kanban (fetches notes for multiple opportunities)
export function useMultiOpportunityNotes(opportunityIds: string[]) {
  const [notesMap, setNotesMap] = useState<Map<string, OpportunityNote[]>>(new Map());
  const [pinnedMap, setPinnedMap] = useState<Map<string, Set<string>>>(new Map());

  const fetchAll = useCallback(async () => {
    if (opportunityIds.length === 0) return;
    const { data, error } = await supabase
      .from('opportunity_notes')
      .select('*')
      .in('opportunity_id', opportunityIds)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const map = new Map<string, OpportunityNote[]>();
    const pMap = new Map<string, Set<string>>();
    (data as unknown as OpportunityNote[]).forEach(n => {
      const list = map.get(n.opportunity_id) || [];
      list.push(n);
      map.set(n.opportunity_id, list);
      if (n.is_pinned) {
        const s = pMap.get(n.opportunity_id) || new Set();
        s.add(n.id);
        pMap.set(n.opportunity_id, s);
      }
    });
    setNotesMap(map);
    setPinnedMap(pMap);
  }, [opportunityIds.join(',')]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addNote = async (note: Omit<OpportunityNote, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('opportunity_notes')
      .insert({
        opportunity_id: note.opportunity_id,
        account_id: note.account_id,
        content: note.content,
        created_by: note.created_by,
        is_pinned: note.is_pinned || false,
        parent_id: note.parent_id || null,
      })
      .select()
      .single();
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return null; }
    const newNote = data as unknown as OpportunityNote;
    setNotesMap(prev => {
      const next = new Map(prev);
      const list = next.get(newNote.opportunity_id) || [];
      next.set(newNote.opportunity_id, [newNote, ...list]);
      return next;
    });
    if (newNote.is_pinned) {
      setPinnedMap(prev => {
        const next = new Map(prev);
        const s = new Set(next.get(newNote.opportunity_id) || []);
        s.add(newNote.id);
        next.set(newNote.opportunity_id, s);
        return next;
      });
    }
    return newNote;
  };

  const updateNote = async (id: string, content: string, oppId: string) => {
    const { error } = await supabase.from('opportunity_notes').update({ content }).eq('id', id);
    if (error) { toast.error('แก้ไขไม่สำเร็จ'); return; }
    setNotesMap(prev => {
      const next = new Map(prev);
      const list = (next.get(oppId) || []).map(n => n.id === id ? { ...n, content } : n);
      next.set(oppId, list);
      return next;
    });
  };

  const deleteNote = async (id: string, oppId: string) => {
    const { error } = await supabase.from('opportunity_notes').delete().eq('id', id);
    if (error) { toast.error('ลบไม่สำเร็จ'); return; }
    setNotesMap(prev => {
      const next = new Map(prev);
      next.set(oppId, (next.get(oppId) || []).filter(n => n.id !== id));
      return next;
    });
    setPinnedMap(prev => {
      const next = new Map(prev);
      const s = new Set(next.get(oppId) || []);
      s.delete(id);
      next.set(oppId, s);
      return next;
    });
  };

  const togglePin = async (id: string, oppId: string) => {
    const list = notesMap.get(oppId) || [];
    const note = list.find(n => n.id === id);
    if (!note) return;
    const newPinned = !note.is_pinned;
    const { error } = await supabase.from('opportunity_notes').update({ is_pinned: newPinned }).eq('id', id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    setNotesMap(prev => {
      const next = new Map(prev);
      next.set(oppId, (next.get(oppId) || []).map(n => n.id === id ? { ...n, is_pinned: newPinned } : n));
      return next;
    });
    setPinnedMap(prev => {
      const next = new Map(prev);
      const s = new Set(next.get(oppId) || []);
      if (newPinned) s.add(id); else s.delete(id);
      next.set(oppId, s);
      return next;
    });
  };

  const getNotesForOpportunity = (oppId: string) => notesMap.get(oppId) || [];
  const getPinnedIds = (oppId: string) => pinnedMap.get(oppId) || new Set<string>();

  return { notesMap, pinnedMap, getNotesForOpportunity, getPinnedIds, addNote, updateNote, deleteNote, togglePin, refetch: fetchAll };
}
