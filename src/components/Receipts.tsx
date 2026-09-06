import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Camera,
  Plus,
  Search,
  X,
  Trash2,
  Edit2,
  ArrowLeft,
  Receipt,
  Image as ImageIcon,
  Tag,
  Star,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

// Maximum label length to prevent UI overflow
const MAX_LABEL_LENGTH = 100;

// Maximum image size in bytes (500KB after compression)
const MAX_IMAGE_SIZE = 500 * 1024;

// localStorage quota warning threshold (4MB)
const STORAGE_WARNING_THRESHOLD = 4 * 1024 * 1024;

// Debounce delay for search input (ms)
const SEARCH_DEBOUNCE_MS = 150;

// Types
interface ReceiptData {
  id: string;
  imageData: string;
  label: string;
  category: ReceiptCategory;
  store?: string;
  createdAt: string;
  updatedAt: string;
}

type ReceiptCategory = 'Materials' | 'Tools' | 'Fuel' | 'Food' | 'Misc';

const CATEGORIES: ReceiptCategory[] = ['Materials', 'Tools', 'Fuel', 'Food', 'Misc'];

const DATE_GROUPS = ['Today', 'Yesterday', 'This Week', 'Older'] as const;

/* Scoped to the `rc-` prefix so nothing here can reach another screen. */
const styles = `
.rc-warn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: var(--lv-r-lg);
  background: var(--lv-amber-soft);
}
.rc-warn svg { flex-shrink: 0; margin-top: 2px; color: var(--lv-amber); }

.rc-tools { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.rc-segwrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin: -3px; padding: 3px; }
.rc-segwrap::-webkit-scrollbar { display: none; }
/* the seg must size to its own buttons, or its ground stops short of them when the row scrolls */
.rc-segwrap .lv-seg { width: max-content; }
.rc-find { min-width: 0; }
.rc-n { margin-left: 6px; color: var(--lv-faint); font-variant-numeric: tabular-nums; }
.lv-seg button.on .rc-n { color: var(--lv-mute); }
@media (min-width: 900px) {
  .rc-tools { flex-direction: row; align-items: center; justify-content: space-between; }
  .rc-find { flex: 0 1 380px; }
}

.rc-list { overflow: hidden; }
.rc-gh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 18px;
  background: var(--lv-surface-2);
  border-bottom: 1px solid var(--lv-line);
}
.rc-row { gap: 12px; }
.rc-thumb {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--lv-r-sm);
  border: 1px solid var(--lv-line);
  background: var(--lv-sunken);
  color: var(--lv-faint);
  overflow: hidden;
  display: grid;
  place-items: center;
}
.rc-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rc-main { min-width: 0; flex: 1; }
.rc-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rc-right { flex-shrink: 0; display: flex; align-items: center; gap: 10px; }

.rc-logo-sm { width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0; display: block; }
.rc-logo-md { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; display: block; }
.rc-logo-lg { width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0; display: block; }

.rc-pick { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rc-pick button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 132px;
  padding: 20px 12px;
  border: 1px dashed var(--lv-line-2);
  border-radius: var(--lv-r-lg);
  background: var(--lv-surface);
  cursor: pointer;
  font: 600 14px var(--lv-font);
  color: var(--lv-ink-2);
  transition: border-color var(--lv-t) var(--lv-ease), color var(--lv-t) var(--lv-ease), background var(--lv-t) var(--lv-ease);
}
.rc-pick button svg { color: var(--lv-blue); }
@media (hover: hover) and (pointer: fine) {
  .rc-pick button:hover { border-color: var(--lv-blue); color: var(--lv-blue-2); background: var(--lv-blue-soft); }
}

.rc-preview {
  background: var(--lv-sunken);
  border: 1px solid var(--lv-line);
  border-radius: var(--lv-r-lg);
  overflow: hidden;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
}
.rc-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }

.rc-full {
  position: relative;
  background: var(--lv-sunken);
  border: 1px solid var(--lv-line);
  border-radius: var(--lv-r-lg);
  overflow: hidden;
  min-height: 150px;
  display: grid;
  place-items: center;
  color: var(--lv-faint);
}
.rc-full img { width: 100%; max-height: 46vh; object-fit: contain; display: block; }
.rc-full-logo {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  padding: 5px;
  border-radius: var(--lv-r-sm);
  border: 1px solid var(--lv-line);
  background: var(--lv-surface);
  box-shadow: var(--lv-shadow-sm);
}

.rc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.rc-detected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lv-line);
  border-radius: var(--lv-r);
  background: var(--lv-surface-2);
}
.rc-rows .lv-row:last-child { border-bottom: 0; }
.rc-rows .lv-row { align-items: flex-start; }
.rc-val { text-align: right; font-weight: 600; color: var(--lv-ink); overflow-wrap: anywhere; }
.rc-back { margin-right: 2px; }

@media (max-width: 520px) {
  .rc-gh { padding-left: 14px; padding-right: 14px; }
  .rc-row { padding-left: 14px; padding-right: 14px; }
}
`;
// ============================================================================
// STORE LOGO SVG COMPONENTS (Static - defined outside component to prevent re-renders)
// ============================================================================

const StoreLogoSVGs: Record<string, React.FC<{ className?: string }>> = {
  'Home Depot': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#F96302"/>
      <path d="M8 12H32V28H8V12Z" fill="white"/>
      <path d="M12 16H18V24H12V16Z" fill="#F96302"/>
      <path d="M22 16H28V24H22V16Z" fill="#F96302"/>
      <path d="M18 14L20 10L22 14H18Z" fill="white"/>
    </svg>
  ),
  "Lowe's": ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#004990"/>
      <path d="M10 12H16V28H10V12Z" fill="white"/>
      <path d="M10 22H22V28H10V22Z" fill="white"/>
      <circle cx="28" cy="20" r="6" stroke="white" strokeWidth="3" fill="none"/>
    </svg>
  ),
  'Ace Hardware': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#D40029"/>
      <path d="M20 8L32 32H8L20 8Z" fill="white"/>
      <path d="M20 14L26 28H14L20 14Z" fill="#D40029"/>
    </svg>
  ),
  'Sherwin-Williams': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#0066B2"/>
      <ellipse cx="20" cy="18" rx="12" ry="8" fill="white"/>
      <path d="M14 22C14 22 16 30 20 30C24 30 26 22 26 22" stroke="#E31837" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="20" cy="16" r="4" fill="#E31837"/>
    </svg>
  ),
  'Lumber Yard': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#5D4037"/>
      <rect x="8" y="20" width="24" height="4" fill="#8D6E63" rx="1"/>
      <rect x="8" y="26" width="24" height="4" fill="#A1887F" rx="1"/>
      <rect x="8" y="14" width="24" height="4" fill="#6D4C41" rx="1"/>
      <path d="M20 6L28 14H12L20 6Z" fill="#4CAF50"/>
    </svg>
  ),
  'Gas Station': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#2E7D32"/>
      <rect x="10" y="12" width="14" height="20" rx="2" fill="white"/>
      <rect x="12" y="14" width="10" height="8" fill="#2E7D32"/>
      <path d="M26 16H30V24C30 25.1 29.1 26 28 26H26V16Z" fill="white"/>
      <circle cx="17" cy="28" r="2" fill="#2E7D32"/>
    </svg>
  ),
  'Restaurant': ({ className }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#E65100"/>
      <path d="M12 10V18C12 20.2 13.8 22 16 22V32H18V22C20.2 22 22 20.2 22 18V10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 10V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 10V32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 10C26 10 30 12 30 18C30 22 26 22 26 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};


// Quick-select stores with their default categories
const QUICK_STORES: { name: string; category: ReceiptCategory }[] = [
  { name: 'Home Depot', category: 'Materials' },
  { name: "Lowe's", category: 'Materials' },
  { name: 'Lumber Yard', category: 'Materials' },
  { name: 'Ace Hardware', category: 'Tools' },
  { name: 'Sherwin-Williams', category: 'Materials' },
  { name: 'Gas Station', category: 'Fuel' },
  { name: 'Restaurant', category: 'Food' },
];

// Category-based label suggestions
const CATEGORY_SUGGESTIONS: Record<ReceiptCategory, string[]> = {
  Materials: ['Home Depot', "Lowe's", 'Lumber Yard', 'Drywall', 'Paint', 'Plywood', '2x4s'],
  Tools: ['Drill', 'Saw', 'Blades', 'Bits', 'Hammer', 'Ace Hardware'],
  Fuel: ['Gas', 'Diesel', 'Propane', 'Gas Station'],
  Food: ['Lunch', 'Coffee', 'Breakfast', 'Restaurant', 'Snacks'],
  Misc: ['Office Supplies', 'Parking', 'Permits', 'Other'],
};

// Keyword to category mapping for auto-suggest
const KEYWORD_CATEGORY_MAP: { keywords: string[]; category: ReceiptCategory }[] = [
  { keywords: ['home depot', 'lowes', "lowe's", 'lumber', 'plywood', '2x4', 'drywall', 'paint', 'sherwin', 'wood', 'concrete', 'tile', 'flooring'], category: 'Materials' },
  { keywords: ['gas', 'fuel', 'diesel', 'propane', 'shell', 'chevron', 'exxon', 'bp', 'mobil', 'texaco'], category: 'Fuel' },
  { keywords: ['hammer', 'drill', 'tool', 'bit', 'blade', 'saw', 'wrench', 'screwdriver', 'ace hardware'], category: 'Tools' },
  { keywords: ['coffee', 'lunch', 'food', 'restaurant', 'breakfast', 'dinner', 'snack', 'mcdonald', 'subway', 'starbucks', 'dunkin'], category: 'Food' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to generate UUID with fallback for older browsers
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to detect category from label
function detectCategoryFromLabel(label: string): ReceiptCategory | null {
  if (!label || typeof label !== 'string') return null;
  const lowerLabel = label.toLowerCase();
  for (const mapping of KEYWORD_CATEGORY_MAP) {
    if (mapping.keywords.some(keyword => lowerLabel.includes(keyword))) {
      return mapping.category;
    }
  }
  return null;
}

// Helper to detect store from label
function detectStoreFromLabel(label: string): string | null {
  if (!label || typeof label !== 'string') return null;
  const lowerLabel = label.toLowerCase();
  for (const store of Object.keys(StoreLogoSVGs)) {
    if (lowerLabel.includes(store.toLowerCase())) {
      return store;
    }
  }
  // Check for partial matches
  if (lowerLabel.includes('home depot')) return 'Home Depot';
  if (lowerLabel.includes('lowe')) return "Lowe's";
  if (lowerLabel.includes('ace')) return 'Ace Hardware';
  if (lowerLabel.includes('sherwin')) return 'Sherwin-Williams';
  if (lowerLabel.includes('lumber')) return 'Lumber Yard';
  if (lowerLabel.includes('gas') || lowerLabel.includes('fuel') || lowerLabel.includes('shell') || lowerLabel.includes('chevron')) return 'Gas Station';
  if (lowerLabel.includes('restaurant') || lowerLabel.includes('cafe') || lowerLabel.includes('diner')) return 'Restaurant';
  return null;
}

// Helper to get date group
function getDateGroup(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Older';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const receiptDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (receiptDate >= today) return 'Today';
    if (receiptDate >= yesterday) return 'Yesterday';
    if (receiptDate >= weekAgo) return 'This Week';
    return 'Older';
  } catch {
    return 'Older';
  }
}

// Helper to estimate localStorage usage
function getLocalStorageSize(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
      }
    }
    return total;
  } catch {
    return 0;
  }
}

// Helper to compress image data URL with timeout

async function compressImage(dataUrl: string, maxSize: number = MAX_IMAGE_SIZE): Promise<string> {
  // Add timeout to prevent hanging on corrupted images
  const COMPRESSION_TIMEOUT_MS = 10000; // 10 seconds
  
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      console.error('Image compression timed out');
      reject(new Error('Image compression timed out. Please try a different image.'));
    }, COMPRESSION_TIMEOUT_MS);
    
    // Validate input
    if (!dataUrl || typeof dataUrl !== 'string') {
      clearTimeout(timeoutId);
      reject(new Error('Invalid image data'));
      return;
    }
    
    // If already small enough, return as-is
    if (dataUrl.length * 0.75 <= maxSize) {
      clearTimeout(timeoutId);
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      clearTimeout(timeoutId);
      
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Validate dimensions
        if (width === 0 || height === 0) {
          reject(new Error('Invalid image dimensions'));
          return;
        }
        
        // Scale down if too large
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Try different quality levels
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        while (result.length * 0.75 > maxSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(result);
      } catch (error) {
        console.error('Canvas compression error:', error);
        reject(new Error('Failed to compress image'));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.error('Failed to load image for compression');
      reject(new Error('Failed to load image. The file may be corrupted or unsupported.'));
    };
    
    // Start loading the image
    img.src = dataUrl;
  });
}


// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

// Store Logo Component - Memoized
const StoreLogo = memo<{ store?: string; size?: 'sm' | 'md' | 'lg' }>(({ store, size = 'md' }) => {
  if (!store || !StoreLogoSVGs[store]) return null;

  const sizeClasses = {
    sm: 'rc-logo-sm',
    md: 'rc-logo-md',
    lg: 'rc-logo-lg',
  };

  const LogoComponent = StoreLogoSVGs[store];
  return <LogoComponent className={sizeClasses[size]} />;
});
StoreLogo.displayName = 'StoreLogo';

// Category picker - Memoized. One segmented control, the selected one carries .on.
const CategoryChips = memo<{
  selected: ReceiptCategory;
  onChange: (category: ReceiptCategory) => void;
}>(({ selected, onChange }) => {
  return (
    <div className="rc-segwrap">
      <div className="lv-seg" role="group" aria-label="Category">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            className={selected === cat ? 'on' : ''}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
});
CategoryChips.displayName = 'CategoryChips';

// Quick Store Button Component - Memoized
const QuickStoreButton = memo<{
  store: { name: string; category: ReceiptCategory };
  onClick: () => void;
}>(({ store, onClick }) => {
  return (
    <button type="button" className="lv-btn sec sm" onClick={onClick}>
      <StoreLogo store={store.name} size="sm" />
      {store.name}
    </button>
  );
});
QuickStoreButton.displayName = 'QuickStoreButton';

// One receipt, as a row in the list card - Memoized
const ReceiptCard = memo<{
  receipt: ReceiptData;
  onClick: () => void;
}>(({ receipt, onClick }) => {
  const [imageError, setImageError] = useState(false);

  const date = useMemo(() => {
    try {
      return new Date(receipt.createdAt);
    } catch {
      return new Date();
    }
  }, [receipt.createdAt]);

  const formattedDate = useMemo(() => {
    try {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Unknown date';
    }
  }, [date]);

  const displayLabel = receipt.label?.slice(0, MAX_LABEL_LENGTH) || 'Untitled receipt';

  return (
    <button type="button" className="lv-row rc-row" onClick={onClick}>
      <span className="rc-thumb">
        {!imageError && receipt.imageData ? (
          <img
            src={receipt.imageData}
            alt=""
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <Receipt size={18} />
        )}
      </span>

      <span className="rc-main">
        <span className="lv-row-t rc-clip" style={{ display: 'block' }}>{displayLabel}</span>
        <span className="lv-row-s rc-clip lv-num" style={{ display: 'block' }}>
          {receipt.store ? `${receipt.store} · ` : ''}{formattedDate}
        </span>
      </span>

      <span className="rc-right">
        <span className="lv-pill">{receipt.category}</span>
      </span>
    </button>
  );
});
ReceiptCard.displayName = 'ReceiptCard';
// ============================================================================
// LOCAL STORAGE HOOK
// ============================================================================

function useReceiptsStorage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [favoriteLabels, setFavoriteLabels] = useState<string[]>([]);
  const [lastCategories, setLastCategories] = useState<ReceiptCategory[]>([]);
  const [storageWarning, setStorageWarning] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('levelworks_receipts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate each receipt has required fields
          const validReceipts = parsed.filter((r): r is ReceiptData => 
            r && typeof r.id === 'string' && typeof r.createdAt === 'string'
          );
          setReceipts(validReceipts);
        }
      }
    } catch (e) {
      console.error('Error loading receipts:', e);
      setReceipts([]);
    }

    try {
      const storedFavorites = localStorage.getItem('levelworks_favorite_labels');
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) {
          setFavoriteLabels(parsed.filter(l => typeof l === 'string'));
        }
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
      setFavoriteLabels([]);
    }

    try {
      const storedLastCats = localStorage.getItem('levelworks_last_categories');
      if (storedLastCats) {
        const parsed = JSON.parse(storedLastCats);
        if (Array.isArray(parsed)) {
          setLastCategories(parsed.filter(c => CATEGORIES.includes(c)));
        }
      }
    } catch (e) {
      console.error('Error loading last categories:', e);
      setLastCategories([]);
    }

    // Check storage usage
    const usage = getLocalStorageSize();
    if (usage > STORAGE_WARNING_THRESHOLD) {
      setStorageWarning(true);
    }
  }, []);



  const trackLabel = useCallback((label: string) => {
    if (!label || typeof label !== 'string' || !label.trim()) return;
    const trimmedLabel = label.trim().slice(0, MAX_LABEL_LENGTH);
    setFavoriteLabels(prev => {
      const existing = prev.filter(l => l.toLowerCase() !== trimmedLabel.toLowerCase());
      const updated = [trimmedLabel, ...existing].slice(0, 10);
      try {
        localStorage.setItem('levelworks_favorite_labels', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving favorite labels:', e);
      }
      return updated;
    });
  }, []);

  const trackCategory = useCallback((category: ReceiptCategory) => {
    if (!CATEGORIES.includes(category)) return;
    setLastCategories(prev => {
      const updated = [category, ...prev].slice(0, 3);
      try {
        localStorage.setItem('levelworks_last_categories', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving last categories:', e);
      }
      return updated;
    });
  }, []);

  const getDefaultCategory = useCallback((): ReceiptCategory => {
    if (lastCategories.length >= 3 && lastCategories.every(c => c === lastCategories[0])) {
      return lastCategories[0];
    }
    return 'Misc';
  }, [lastCategories]);

  const addReceipt = useCallback(async (receipt: Omit<ReceiptData, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; receipt?: ReceiptData; error?: string }> => {
    try {
      // Validate input
      if (!receipt.imageData) {
        return { success: false, error: 'No image data provided' };
      }

      // Compress image before saving
      let compressedImage: string;
      try {
        compressedImage = await compressImage(receipt.imageData);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        return { 
          success: false, 
          error: compressionError instanceof Error ? compressionError.message : 'Failed to process image' 
        };
      }
      
      const newReceipt: ReceiptData = {
        ...receipt,
        imageData: compressedImage,
        label: (receipt.label || '').slice(0, MAX_LABEL_LENGTH),
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Try to save to localStorage FIRST before updating state
      try {
        const currentReceipts = localStorage.getItem('levelworks_receipts');
        const existingReceipts: ReceiptData[] = currentReceipts ? JSON.parse(currentReceipts) : [];
        const updatedReceipts = [newReceipt, ...existingReceipts];
        
        // Attempt to save - this will throw if quota exceeded
        localStorage.setItem('levelworks_receipts', JSON.stringify(updatedReceipts));
        
        // Check storage usage after save
        const usage = getLocalStorageSize();
        if (usage > STORAGE_WARNING_THRESHOLD) {
          setStorageWarning(true);
        }
        
        // Only update state after successful localStorage save
        setReceipts(updatedReceipts);
        
        // Track label and category for suggestions
        trackLabel(receipt.label);
        trackCategory(receipt.category);
        
        return { success: true, receipt: newReceipt };
      } catch (storageError) {
        console.error('localStorage save failed:', storageError);
        
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          setStorageWarning(true);
          return { 
            success: false, 
            error: 'Storage is full. Please delete some old receipts to free up space.' 
          };
        }
        
        return { 
          success: false, 
          error: 'Failed to save receipt to device storage. Please try again.' 
        };
      }
    } catch (e) {
      console.error('Error adding receipt:', e);
      return { 
        success: false, 
        error: e instanceof Error ? e.message : 'An unexpected error occurred' 
      };
    }
  }, [trackLabel, trackCategory]);


  const updateReceipt = useCallback((id: string, updates: Partial<Pick<ReceiptData, 'label' | 'category' | 'store'>>) => {
    if (!id) return;
    
    setReceipts(prev => {
      const updated = prev.map(r => 
        r.id === id ? { 
          ...r, 
          ...updates, 
          label: updates.label ? updates.label.slice(0, MAX_LABEL_LENGTH) : r.label,
          updatedAt: new Date().toISOString() 
        } : r
      );
      try {
        localStorage.setItem('levelworks_receipts', JSON.stringify(updated));
      } catch (e) {
        console.error('Error updating receipt:', e);
      }
      return updated;
    });
    
    if (updates.label) trackLabel(updates.label);
    if (updates.category) trackCategory(updates.category);
  }, [trackLabel, trackCategory]);

  const deleteReceipt = useCallback((id: string) => {
    if (!id) return;
    
    setReceipts(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('levelworks_receipts', JSON.stringify(updated));
        const usage = getLocalStorageSize();
        setStorageWarning(usage > STORAGE_WARNING_THRESHOLD);
      } catch (e) {
        console.error('Error deleting receipt:', e);
      }
      return updated;
    });
  }, []);

  return { 
    receipts, 
    addReceipt, 
    updateReceipt, 
    deleteReceipt, 
    favoriteLabels,
    getDefaultCategory,
    storageWarning
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Receipts: React.FC = () => {
  const { receipts, addReceipt, updateReceipt, deleteReceipt, favoriteLabels, getDefaultCategory, storageWarning } = useReceiptsStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ReceiptCategory>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const { toast } = useToast();

  // Debounced search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  // Filter receipts on the category segment and the debounced search
  const filteredReceipts = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return receipts.filter(receipt => {
      if (categoryFilter !== 'All' && receipt.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        (receipt.label && receipt.label.toLowerCase().includes(query)) ||
        (receipt.category && receipt.category.toLowerCase().includes(query)) ||
        (receipt.store && receipt.store.toLowerCase().includes(query))
      );
    });
  }, [receipts, debouncedSearchQuery, categoryFilter]);

  // Group receipts by date - memoized for performance
  const groupedReceipts = useMemo(() => {
    const groups: Record<string, ReceiptData[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': [],
    };

    filteredReceipts.forEach(receipt => {
      const group = getDateGroup(receipt.createdAt);
      if (groups[group]) {
        groups[group].push(receipt);
      } else {
        groups['Older'].push(receipt);
      }
    });

    return groups;
  }, [filteredReceipts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: receipts.length };
    CATEGORIES.forEach(cat => { counts[cat] = 0; });
    receipts.forEach(r => { if (counts[r.category] !== undefined) counts[r.category] += 1; });
    return counts;
  }, [receipts]);

  const handleReceiptClick = useCallback((receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setShowDetailView(true);
  }, []);

  const handleAddComplete = useCallback(() => {
    setShowAddModal(false);
    toast({
      title: 'Receipt saved',
      description: 'It is stored on this device.',
    });
  }, [toast]);

  const handleCloseDetail = useCallback(() => {
    setShowDetailView(false);
    setSelectedReceipt(null);
  }, []);

  const handleUpdateReceipt = useCallback((updates: Partial<Pick<ReceiptData, 'label' | 'category' | 'store'>>) => {
    if (!selectedReceipt) return;
    updateReceipt(selectedReceipt.id, updates);
    setSelectedReceipt(prev => prev ? { ...prev, ...updates } : null);
    toast({ title: 'Receipt updated' });
  }, [selectedReceipt, updateReceipt, toast]);

  const handleDeleteReceipt = useCallback(() => {
    if (!selectedReceipt) return;
    deleteReceipt(selectedReceipt.id);
    setShowDetailView(false);
    setSelectedReceipt(null);
    toast({ title: 'Receipt deleted' });
  }, [selectedReceipt, deleteReceipt, toast]);

  const isFiltered = categoryFilter !== 'All' || debouncedSearchQuery.trim().length > 0;

  const clearFilters = () => { setCategoryFilter('All'); setSearchQuery(''); };

  return (
    <div>
      <style>{styles}</style>

      {storageWarning && (
        <div className="rc-warn">
          <AlertTriangle size={18} />
          <div>
            <p className="lv-h3">Storage is nearly full</p>
            <p className="lv-small" style={{ marginTop: 3 }}>
              Receipts are kept on this device. Delete a few old ones to make room.
            </p>
          </div>
        </div>
      )}

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">Receipts</h1>
          <p className="lv-sub">Every job expense, photographed and filed.</p>
        </div>
        <button className="lv-btn pri" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add receipt
        </button>
      </div>

      {receipts.length > 0 && (
        <div className="rc-tools">
          <div className="rc-segwrap">
            <div className="lv-seg" role="group" aria-label="Filter by category">
              {(['All', ...CATEGORIES] as const).map(cat => (
                <button
                  key={cat}
                  className={categoryFilter === cat ? 'on' : ''}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}<span className="rc-n">{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rc-find">
            <div className="lv-search">
              <Search size={16} />
              <input
                className="lv-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search label, category or store"
                aria-label="Search receipts"
                maxLength={100}
              />
            </div>
          </div>
        </div>
      )}

      {filteredReceipts.length === 0 ? (
        <div className="lv-empty">
          <Receipt size={30} />
          <h3>{isFiltered ? 'Nothing matches that' : 'No receipts yet'}</h3>
          <p>
            {isFiltered
              ? 'Try a different word, or switch the category back to all.'
              : 'Photograph a receipt on the way out of the store and it is filed before you get back to the truck.'}
          </p>
          {isFiltered ? (
            <button className="lv-btn sec" onClick={clearFilters}>Show all receipts</button>
          ) : (
            <button className="lv-btn pri" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add your first receipt
            </button>
          )}
        </div>
      ) : (
        <div className="lv-card rc-list">
          {DATE_GROUPS.map(group => {
            const groupReceipts = groupedReceipts[group];
            if (!groupReceipts || groupReceipts.length === 0) return null;

            return (
              <React.Fragment key={group}>
                <div className="rc-gh">
                  <span className="lv-eyebrow">{group}</span>
                  <span className="lv-small lv-num">{groupReceipts.length}</span>
                </div>
                {groupReceipts.map(receipt => (
                  <ReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    onClick={() => handleReceiptClick(receipt)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Add Receipt Modal */}
      <AddReceiptModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (data) => {
          const result = await addReceipt(data);
          if (result.success) {
            handleAddComplete();
          } else {
            toast({
              title: 'Could not save the receipt',
              description: result.error || 'Something went wrong. Try again.',
              variant: 'destructive',
            });
          }
        }}
        favoriteLabels={favoriteLabels}
        defaultCategory={getDefaultCategory()}
      />

      {/* Receipt Detail View */}
      {selectedReceipt && (
        <ReceiptDetailModal
          open={showDetailView}
          receipt={selectedReceipt}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateReceipt}
          onDelete={handleDeleteReceipt}
        />
      )}
    </div>
  );
};

// ============================================================================
// ADD RECEIPT MODAL
// ============================================================================

const AddReceiptModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (data: { imageData: string; label: string; category: ReceiptCategory; store?: string }) => void;
  favoriteLabels: string[];
  defaultCategory: ReceiptCategory;
}> = ({ open, onClose, onSave, favoriteLabels, defaultCategory }) => {
  const [step, setStep] = useState<'capture' | 'details'>('capture');
  const [imageData, setImageData] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ReceiptCategory>(defaultCategory);
  const [store, setStore] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  const resetForm = useCallback(() => {
    setStep('capture');
    setImageData(null);
    setLabel('');
    setCategory(defaultCategory);
    setStore(undefined);
    setIsSaving(false);
  }, [defaultCategory]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setImageData(result);
          setStep('details');
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, []);

  // Auto-suggest category when label changes
  const handleLabelChange = useCallback((newLabel: string) => {
    const trimmedLabel = newLabel.slice(0, MAX_LABEL_LENGTH);
    setLabel(trimmedLabel);

    // Detect category from label
    const detectedCategory = detectCategoryFromLabel(trimmedLabel);
    if (detectedCategory) {
      setCategory(detectedCategory);
    }

    // Detect store from label
    const detectedStore = detectStoreFromLabel(trimmedLabel);
    if (detectedStore) {
      setStore(detectedStore);
    } else {
      setStore(undefined);
    }
  }, []);

  // Handle quick store selection
  const handleQuickStore = useCallback((storeName: string, storeCategory: ReceiptCategory) => {
    setLabel(storeName);
    setCategory(storeCategory);
    setStore(storeName);
  }, []);

  // Handle favorite label selection
  const handleFavoriteLabel = useCallback((favLabel: string) => {
    setLabel(favLabel);
    const detectedCategory = detectCategoryFromLabel(favLabel);
    if (detectedCategory) {
      setCategory(detectedCategory);
    }
    const detectedStore = detectStoreFromLabel(favLabel);
    if (detectedStore) {
      setStore(detectedStore);
    } else {
      setStore(undefined);
    }
  }, []);

  // Get smart suggestions based on selected category
  const smartSuggestions = useMemo(() => {
    return CATEGORY_SUGGESTIONS[category].filter(
      s => s.toLowerCase() !== label.toLowerCase()
    ).slice(0, 5);
  }, [category, label]);

  const handleSave = useCallback(async () => {
    if (!imageData || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ imageData, label, category, store });
      resetForm();
    } catch (e) {
      console.error('Error saving receipt:', e);
      setIsSaving(false);
    }
  }, [imageData, isSaving, onSave, label, category, store, resetForm]);

  if (!open) return null;

  return (
    <div className="lv-scrim" onClick={handleClose}>
      <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add receipt">
        <div className="lv-modal-head">
          <div className="lv-inline" style={{ gap: 4, minWidth: 0, flexWrap: 'nowrap' }}>
            {step === 'details' && (
              <button
                className="lv-icon-btn rc-back"
                onClick={() => setStep('capture')}
                type="button"
                aria-label="Back"
                disabled={isSaving}
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <span className="lv-eyebrow">Receipt</span>
              <h2 className="lv-h2" style={{ marginTop: 2 }}>{step === 'capture' ? 'Add a receipt' : 'Receipt details'}</h2>
            </div>
          </div>
          <button className="lv-icon-btn" onClick={handleClose} type="button" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="lv-modal-body">
          {step === 'capture' ? (
            <div className="lv-stack">
              <p className="lv-sub">Take a photo of the receipt, or pick one already on your phone.</p>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                aria-hidden="true"
              />

              <div className="rc-pick">
                <button type="button" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={28} />
                  Take a photo
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={28} />
                  Choose an image
                </button>
              </div>
            </div>
          ) : (
            <div className="lv-stack">
              {/* Image Preview */}
              {imageData && (
                <div className="rc-preview">
                  <img src={imageData} alt="Receipt preview" />
                </div>
              )}

              {/* Quick Store Buttons */}
              <div>
                <span className="lv-label">Quick pick a store</span>
                <div className="rc-chips">
                  {QUICK_STORES.map(s => (
                    <QuickStoreButton
                      key={s.name}
                      store={s}
                      onClick={() => handleQuickStore(s.name, s.category)}
                    />
                  ))}
                </div>
              </div>

              {/* Favorite Labels */}
              {favoriteLabels.length > 0 && (
                <div>
                  <span className="lv-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Star size={13} /> Recent labels
                  </span>
                  <div className="rc-chips">
                    {favoriteLabels.slice(0, 6).map(fav => (
                      <button
                        key={fav}
                        type="button"
                        className="lv-btn sec sm"
                        onClick={() => handleFavoriteLabel(fav)}
                      >
                        {fav}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Label */}
              <div className="lv-field">
                <label className="lv-label" htmlFor="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Tag size={13} /> Label
                </label>
                <input
                  id="label"
                  className="lv-input"
                  placeholder="Home Depot, oil change, lumber"
                  value={label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  maxLength={MAX_LABEL_LENGTH}
                  disabled={isSaving}
                />

                {/* Smart Suggestions based on category */}
                {smartSuggestions.length > 0 && !label && (
                  <div className="rc-chips" style={{ marginTop: 10 }}>
                    {smartSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className="lv-btn quiet sm"
                        onClick={() => handleLabelChange(suggestion)}
                        disabled={isSaving}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <span className="lv-label">Category</span>
                <CategoryChips selected={category} onChange={setCategory} />
              </div>

              {/* Store Logo Preview */}
              {store && StoreLogoSVGs[store] && (
                <div className="rc-detected">
                  <StoreLogo store={store} size="lg" />
                  <div>
                    <p className="lv-h3">Store found</p>
                    <p className="lv-small" style={{ marginTop: 2 }}>{store}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lv-modal-foot">
          <div className="lv-actions">
            <div className="spacer" />
            <button className={`lv-btn sec${step === 'capture' ? ' span' : ''}`} onClick={handleClose} type="button" disabled={isSaving}>
              Cancel
            </button>
            {step === 'details' && (
              <button
                className="lv-btn pri"
                onClick={handleSave}
                type="button"
                disabled={isSaving || !imageData}
              >
                {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save receipt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RECEIPT DETAIL MODAL
// ============================================================================

const ReceiptDetailModal: React.FC<{
  open: boolean;
  receipt: ReceiptData;
  onClose: () => void;
  onUpdate: (updates: Partial<Pick<ReceiptData, 'label' | 'category' | 'store'>>) => void;
  onDelete: () => void;
}> = ({ open, receipt, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(receipt.label);
  const [editCategory, setEditCategory] = useState(receipt.category);
  const [editStore, setEditStore] = useState(receipt.store);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setEditLabel(receipt.label);
    setEditCategory(receipt.category);
    setEditStore(receipt.store);
    setIsEditing(false);
    setImageError(false);
  }, [receipt]);

  const handleLabelChange = useCallback((newLabel: string) => {
    const trimmedLabel = newLabel.slice(0, MAX_LABEL_LENGTH);
    setEditLabel(trimmedLabel);
    const detectedStore = detectStoreFromLabel(trimmedLabel);
    if (detectedStore) {
      setEditStore(detectedStore);
    } else {
      setEditStore(undefined);
    }
    const detectedCategory = detectCategoryFromLabel(trimmedLabel);
    if (detectedCategory) {
      setEditCategory(detectedCategory);
    }
  }, []);

  const handleSaveEdit = useCallback(() => {
    onUpdate({ label: editLabel, category: editCategory, store: editStore });
    setIsEditing(false);
  }, [onUpdate, editLabel, editCategory, editStore]);

  const handleCancelEdit = useCallback(() => {
    setEditLabel(receipt.label);
    setEditCategory(receipt.category);
    setEditStore(receipt.store);
    setIsEditing(false);
  }, [receipt]);

  const date = useMemo(() => {
    try {
      return new Date(receipt.createdAt);
    } catch {
      return new Date();
    }
  }, [receipt.createdAt]);

  const formattedDate = useMemo(() => {
    try {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Unknown date';
    }
  }, [date]);

  const formattedUpdatedDate = useMemo(() => {
    try {
      return new Date(receipt.updatedAt).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }, [receipt.updatedAt]);

  if (!open) return null;

  return (
    <>
      <div className="lv-scrim" onClick={onClose}>
        <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Receipt">
          <div className="lv-modal-head">
            <div className="lv-inline" style={{ gap: 10, minWidth: 0, flexWrap: 'nowrap' }}>
              {receipt.store && <StoreLogo store={receipt.store} size="md" />}
              <div style={{ minWidth: 0 }}>
                <span className="lv-eyebrow">Receipt</span>
                <h2 className="lv-h2 rc-clip" style={{ marginTop: 2 }}>{receipt.label || 'Untitled receipt'}</h2>
              </div>
            </div>
            <button className="lv-icon-btn" onClick={onClose} type="button" aria-label="Close"><X size={20} /></button>
          </div>

          <div className="lv-modal-body">
            <div className="lv-stack">
              {/* Full Image */}
              <div className="rc-full">
                {!imageError && receipt.imageData ? (
                  <img
                    src={receipt.imageData}
                    alt={receipt.label || 'Receipt'}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Receipt size={34} />
                )}
                {receipt.store && StoreLogoSVGs[receipt.store] && (
                  <div className="rc-full-logo">
                    <StoreLogo store={receipt.store} size="md" />
                  </div>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="lv-field">
                    <label className="lv-label" htmlFor="edit-label">Label</label>
                    <input
                      id="edit-label"
                      className="lv-input"
                      value={editLabel}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder="What was it for"
                      maxLength={MAX_LABEL_LENGTH}
                    />
                  </div>

                  <div>
                    <span className="lv-label">Category</span>
                    <CategoryChips selected={editCategory} onChange={setEditCategory} />
                  </div>

                  {editStore && StoreLogoSVGs[editStore] && (
                    <div className="rc-detected">
                      <StoreLogo store={editStore} size="lg" />
                      <div>
                        <p className="lv-h3">Store</p>
                        <p className="lv-small" style={{ marginTop: 2 }}>{editStore}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="lv-card rc-rows">
                  <div className="lv-row">
                    <span className="lv-row-s">Label</span>
                    <span className="rc-val">{receipt.label || 'No label'}</span>
                  </div>
                  <div className="lv-row">
                    <span className="lv-row-s">Category</span>
                    <span className="lv-pill">{receipt.category}</span>
                  </div>
                  {receipt.store && (
                    <div className="lv-row">
                      <span className="lv-row-s">Store</span>
                      <span className="lv-inline" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <StoreLogo store={receipt.store} size="sm" />
                        <span className="rc-val">{receipt.store}</span>
                      </span>
                    </div>
                  )}
                  <div className="lv-row">
                    <span className="lv-row-s">Added</span>
                    <span className="lv-row-r lv-num">{formattedDate}</span>
                  </div>
                  <div className="lv-row">
                    <span className="lv-row-s">Last updated</span>
                    <span className="lv-row-r lv-num">{formattedUpdatedDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lv-modal-foot">
            {isEditing ? (
              <div className="lv-actions">
                <div className="spacer" />
                <button className="lv-btn sec" onClick={handleCancelEdit} type="button">Cancel</button>
                <button className="lv-btn pri" onClick={handleSaveEdit} type="button">Save changes</button>
              </div>
            ) : (
              <div className="lv-actions">
                <button className="lv-btn danger" onClick={() => setShowDeleteConfirm(true)} type="button">
                  <Trash2 size={15} /> Delete
                </button>
                <div className="spacer" />
                <button className="lv-btn sec" onClick={onClose} type="button">Close</button>
                <button className="lv-btn pri span" onClick={() => setIsEditing(true)} type="button">
                  <Edit2 size={15} /> Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="lv-scrim" onClick={() => setShowDeleteConfirm(false)}>
          <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Delete receipt" style={{ maxWidth: 400 }}>
            <div className="lv-modal-head">
              <h2 className="lv-h2">Delete this receipt?</h2>
              <button className="lv-icon-btn" onClick={() => setShowDeleteConfirm(false)} type="button" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="lv-modal-body">
              <p className="lv-sub">It is removed from this device for good. There is no undo.</p>
            </div>
            <div className="lv-modal-foot">
              <div className="lv-actions">
                <div className="spacer" />
                <button className="lv-btn sec" onClick={() => setShowDeleteConfirm(false)} type="button">Keep it</button>
                <button
                  className="lv-btn danger"
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Receipts;
