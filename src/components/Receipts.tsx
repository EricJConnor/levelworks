import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
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
  Calendar,
  Tag,
  Star,
  Clock,
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

const CATEGORY_COLORS: Record<ReceiptCategory, string> = {
  Materials: 'bg-blue-100 text-blue-800 border-blue-200',
  Tools: 'bg-orange-100 text-orange-800 border-orange-200',
  Fuel: 'bg-green-100 text-green-800 border-green-200',
  Food: 'bg-purple-100 text-purple-800 border-purple-200',
  Misc: 'bg-gray-100 text-gray-800 border-gray-200',
};

const CATEGORY_CHIP_COLORS: Record<ReceiptCategory, { active: string; inactive: string }> = {
  Materials: { active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50' },
  Tools: { active: 'bg-orange-600 text-white border-orange-600', inactive: 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50' },
  Fuel: { active: 'bg-green-600 text-white border-green-600', inactive: 'bg-white text-green-700 border-green-300 hover:bg-green-50' },
  Food: { active: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50' },
  Misc: { active: 'bg-gray-600 text-white border-gray-600', inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
};

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
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const LogoComponent = StoreLogoSVGs[store];
  return <LogoComponent className={`${sizeClasses[size]} rounded flex-shrink-0`} />;
});
StoreLogo.displayName = 'StoreLogo';

// Category Chips Component - Memoized
const CategoryChips = memo<{
  selected: ReceiptCategory;
  onChange: (category: ReceiptCategory) => void;
}>(({ selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(cat => {
        const isActive = selected === cat;
        const colors = CATEGORY_CHIP_COLORS[cat];
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all min-h-[44px] ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
});
CategoryChips.displayName = 'CategoryChips';

// Quick Store Button Component - Memoized with larger touch target
const QuickStoreButton = memo<{
  store: { name: string; category: ReceiptCategory };
  onClick: () => void;
}>(({ store, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors min-h-[48px] active:bg-gray-200"
    >
      <StoreLogo store={store.name} size="sm" />
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{store.name}</span>
    </button>
  );
});
QuickStoreButton.displayName = 'QuickStoreButton';

// Receipt Card Component - Memoized
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

  const displayLabel = receipt.label?.slice(0, MAX_LABEL_LENGTH) || 'Untitled Receipt';
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {!imageError && receipt.imageData ? (
          <img
            src={receipt.imageData}
            alt={displayLabel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Receipt className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${CATEGORY_COLORS[receipt.category]}`}>
          {receipt.category}
        </Badge>
        {receipt.store && StoreLogoSVGs[receipt.store] && (
          <div className="absolute top-2 left-2 bg-white rounded-md p-1 shadow-sm">
            <StoreLogo store={receipt.store} size="sm" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          {receipt.store && <StoreLogo store={receipt.store} size="sm" />}
          <h3 className="font-semibold text-gray-800 truncate flex-1">
            {displayLabel}
          </h3>
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </p>
      </div>
    </Card>
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const { toast } = useToast();

  // Debounced search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  // Filter receipts based on debounced search
  const filteredReceipts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return receipts;
    const query = debouncedSearchQuery.toLowerCase();
    return receipts.filter(receipt => 
      (receipt.label && receipt.label.toLowerCase().includes(query)) ||
      (receipt.category && receipt.category.toLowerCase().includes(query)) ||
      (receipt.store && receipt.store.toLowerCase().includes(query))
    );
  }, [receipts, debouncedSearchQuery]);

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

  const handleReceiptClick = useCallback((receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setShowDetailView(true);
  }, []);

  const handleAddComplete = useCallback(() => {
    setShowAddModal(false);
    toast({
      title: 'Receipt Saved',
      description: 'Your receipt has been saved locally.',
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
    toast({ title: 'Receipt Updated' });
  }, [selectedReceipt, updateReceipt, toast]);

  const handleDeleteReceipt = useCallback(() => {
    if (!selectedReceipt) return;
    deleteReceipt(selectedReceipt.id);
    setShowDetailView(false);
    setSelectedReceipt(null);
    toast({ title: 'Receipt Deleted' });
  }, [selectedReceipt, deleteReceipt, toast]);

  return (
    <div className="space-y-6">
      {/* Storage Warning */}
      {storageWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Storage Almost Full</h4>
            <p className="text-sm text-amber-700 mt-1">
              Your device storage is nearly full. Consider deleting old receipts to free up space.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" />
            Receipts
          </h2>
          <p className="text-gray-600 mt-1">Track and organize your expense receipts</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)} 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-h-[48px]"
        >
          <Plus className="w-5 h-5" />
          Add Receipt
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by label, category, or store..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          maxLength={100}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            type="button"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => {
          const count = receipts.filter(r => r.category === cat).length;
          return (
            <Card key={cat} className="p-3 text-center">
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-sm text-gray-600">{cat}</div>
            </Card>
          );
        })}
      </div>

      {/* Receipt List - Grouped by Date */}
      {filteredReceipts.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchQuery ? 'No receipts found' : 'No receipts yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : 'Start by adding your first receipt'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2 min-h-[44px]">
              <Plus className="w-4 h-4" />
              Add Your First Receipt
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {(['Today', 'Yesterday', 'This Week', 'Older'] as const).map(group => {
            const groupReceipts = groupedReceipts[group];
            if (!groupReceipts || groupReceipts.length === 0) return null;

            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{group}</h3>
                  <span className="text-xs text-gray-400">({groupReceipts.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupReceipts.map(receipt => (
                    <ReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      onClick={() => handleReceiptClick(receipt)}
                    />
                  ))}
                </div>
              </div>
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
              title: 'Error Saving Receipt',
              description: result.error || 'Failed to save receipt. Please try again.',
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'details' && (
              <button 
                onClick={() => setStep('capture')} 
                className="mr-2 p-1 hover:bg-gray-100 rounded" 
                type="button" 
                aria-label="Go back"
                disabled={isSaving}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {step === 'capture' ? 'Capture Receipt' : 'Receipt Details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'capture' ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              Take a photo or select an image of your receipt
            </p>
            
            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col gap-3 min-h-[128px]"
                onClick={() => cameraInputRef.current?.click()}
                type="button"
              >
                <Camera className="w-10 h-10 text-blue-600" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col gap-3 min-h-[128px]"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImageIcon className="w-10 h-10 text-green-600" />
                <span>Choose Image</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Image Preview */}
            {imageData && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageData}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Quick Store Buttons */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Quick Select Store</Label>
              <div className="flex flex-wrap gap-2">
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
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Recent Labels
                </Label>
                <div className="flex flex-wrap gap-2">
                  {favoriteLabels.slice(0, 6).map(fav => (
                    <button
                      key={fav}
                      type="button"
                      onClick={() => handleFavoriteLabel(fav)}
                      className="px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors min-h-[40px]"
                    >
                      {fav}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Label
              </Label>
              <Input
                id="label"
                placeholder="e.g., Home Depot, Oil Change, Lumber"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="h-12"
                maxLength={MAX_LABEL_LENGTH}
                disabled={isSaving}
              />
              
              {/* Smart Suggestions based on category */}
              {smartSuggestions.length > 0 && !label && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {smartSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleLabelChange(suggestion)}
                      className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors min-h-[32px]"
                      disabled={isSaving}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Chips */}
            <div className="space-y-2">
              <Label className="block">Category</Label>
              <CategoryChips selected={category} onChange={setCategory} />
            </div>

            {/* Store Logo Preview */}
            {store && StoreLogoSVGs[store] && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <StoreLogo store={store} size="lg" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Store Detected</p>
                  <p className="text-xs text-gray-500">{store}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button" disabled={isSaving}>
            Cancel
          </Button>
          {step === 'details' && (
            <Button 
              onClick={handleSave} 
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]" 
              type="button"
              disabled={isSaving || !imageData}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Receipt'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {receipt.store && <StoreLogo store={receipt.store} size="md" />}
                Receipt Details
              </span>
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      type="button"
                      className="min-h-[36px]"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[36px]"
                      onClick={() => setShowDeleteConfirm(true)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Full Image */}
          <div className="bg-gray-100 rounded-lg overflow-hidden relative">
            {!imageError && receipt.imageData ? (
              <img
                src={receipt.imageData}
                alt={receipt.label || 'Receipt'}
                className="w-full max-h-[50vh] object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-gray-200">
                <Receipt className="w-16 h-16 text-gray-400" />
              </div>
            )}
            {receipt.store && StoreLogoSVGs[receipt.store] && (
              <div className="absolute top-3 left-3 bg-white rounded-lg p-2 shadow-md">
                <StoreLogo store={receipt.store} size="lg" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={editLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="Enter label..."
                    className="h-12"
                    maxLength={MAX_LABEL_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <CategoryChips selected={editCategory} onChange={setEditCategory} />
                </div>
                {editStore && StoreLogoSVGs[editStore] && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <StoreLogo store={editStore} size="lg" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Store</p>
                      <p className="text-xs text-gray-500">{editStore}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancelEdit} type="button" className="min-h-[44px]">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]" type="button">
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Label</p>
                  <p className="font-medium">{receipt.label || 'No label'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <Badge className={CATEGORY_COLORS[receipt.category]}>
                    {receipt.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Added</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formattedUpdatedDate}</p>
                </div>
                {receipt.store && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Store</p>
                    <div className="flex items-center gap-2">
                      <StoreLogo store={receipt.store} size="md" />
                      <span className="font-medium">{receipt.store}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button" className="min-h-[44px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The receipt will be permanently deleted from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete();
              }}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Receipts;
