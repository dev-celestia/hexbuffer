import { useState } from 'react';
import { useTargetStore } from '@/stores/target';
import { useShallow } from 'zustand/react/shallow';
import type { Target } from '@/types';

export function useTargetWidget() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { targets, updateTarget } = useTargetStore(
    useShallow((s) => ({
      targets: s.targets,
      updateTarget: s.updateTarget,
    }))
  );

  const activeTarget = targets.find((t) => t.tabActive) ?? null;

  const filteredTargets =
    searchQuery.trim()
      ? targets.filter((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : targets;

  const handleSelectTarget = (target: Target) => {
    if (!target.tabActive) {
      updateTarget(target.id, { tabActive: true });
    }
  };

  const handleCreateNew = () => {
    setEditingTarget(null);
    setShowCreate(true);
  };

  const handleEditTarget = (target: Target) => {
    setEditingTarget(target);
    setShowCreate(true);
  };

  const handleCancelCreate = () => {
    setShowCreate(false);
    setEditingTarget(null);
  };

  const handleSaveTarget = () => {
    setShowCreate(false);
    setEditingTarget(null);
    setSearchQuery('');
  };

  return {
    showCreate,
    editingTarget,
    searchQuery,
    setSearchQuery,
    targets,
    filteredTargets,
    targetCount: targets.length,
    filteredCount: filteredTargets.length,
    activeTarget,
    handleSelectTarget,
    handleCreateNew,
    handleEditTarget,
    handleCancelCreate,
    handleSaveTarget,
  };
}
