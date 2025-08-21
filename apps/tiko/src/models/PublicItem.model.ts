// Public Item Model (for both cards and sequences)
export interface PublicItem {
  id: string;
  type: 'card' | 'sequence' | 'sequence-item';
  ownerId: string;
  ownerName?: string;
  isPublic: boolean; // Set by owner
  isCurated: boolean; // Set by admin only, can be true even if isPublic is false
  originalIndex: number;
  customIndex?: number; // User's custom ordering
  isOwner: boolean; // Whether current user owns this
  canEdit: boolean; // Whether current user can edit
  canTogglePublic: boolean; // Whether current user can change public status
  canToggleCurated: boolean; // Whether current user can change curated status (admin only)
}

export interface UserItemOrder {
  id: string;
  userId: string;
  itemId: string;
  customIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// Item visibility is not mutually exclusive - items can be:
// - Private (neither public nor curated)
// - Public only (set by owner)
// - Curated only (set by admin, visible to all)
// - Both public and curated
export interface ItemVisibilityFlags {
  isPublic: boolean;
  isCurated: boolean;
}

export type ItemVisibilityFilter = 'all' | 'public' | 'curated' | 'public-or-curated' | 'mine' | 'private';