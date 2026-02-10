import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ChefHat, Bath, Home, Plus, Minus, Save, FileText, 
  Ruler, DollarSign, Palette, Grid3X3, Trash2, 
  ChevronRight, Check, X, Lightbulb, Droplets, Plug,
  Square, RectangleHorizontal, ArrowRight, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type RoomType = 'kitchen' | 'bathroom' | 'basement';

interface Material {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  image?: string;
  description: string;
}

interface Fixture {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  options: { name: string; priceAdd: number }[];
  description: string;
}

interface SelectedItem {
  id: string;
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  options?: string[];
}

interface RoomDesign {
  id: string;
  name: string;
  roomType: RoomType;
  dimensions: { length: number; width: number; height: number };
  selectedItems: SelectedItem[];
  notes: string;
  createdAt: string;
  totalCost: number;
}

// Kitchen Materials & Fixtures
const kitchenMaterials: Material[] = [
  { id: 'k-cab-shaker', name: 'Shaker Style Cabinets', category: 'Cabinets', pricePerUnit: 350, unit: 'linear ft', description: 'Classic shaker style, solid wood' },
  { id: 'k-cab-modern', name: 'Modern Flat Panel Cabinets', category: 'Cabinets', pricePerUnit: 425, unit: 'linear ft', description: 'Sleek modern design, soft-close' },
  { id: 'k-cab-custom', name: 'Custom Built Cabinets', category: 'Cabinets', pricePerUnit: 650, unit: 'linear ft', description: 'Fully customizable, premium materials' },
  { id: 'k-counter-granite', name: 'Granite Countertop', category: 'Countertops', pricePerUnit: 75, unit: 'sq ft', description: 'Natural stone, heat resistant' },
  { id: 'k-counter-quartz', name: 'Quartz Countertop', category: 'Countertops', pricePerUnit: 95, unit: 'sq ft', description: 'Engineered stone, non-porous' },
  { id: 'k-counter-marble', name: 'Marble Countertop', category: 'Countertops', pricePerUnit: 125, unit: 'sq ft', description: 'Luxury natural stone' },
  { id: 'k-counter-butcher', name: 'Butcher Block', category: 'Countertops', pricePerUnit: 65, unit: 'sq ft', description: 'Warm wood aesthetic' },
  { id: 'k-floor-tile', name: 'Porcelain Tile Flooring', category: 'Flooring', pricePerUnit: 12, unit: 'sq ft', description: 'Durable, water resistant' },
  { id: 'k-floor-hardwood', name: 'Hardwood Flooring', category: 'Flooring', pricePerUnit: 18, unit: 'sq ft', description: 'Classic oak or maple' },
  { id: 'k-floor-lvp', name: 'Luxury Vinyl Plank', category: 'Flooring', pricePerUnit: 8, unit: 'sq ft', description: 'Waterproof, budget-friendly' },
  { id: 'k-back-subway', name: 'Subway Tile Backsplash', category: 'Backsplash', pricePerUnit: 15, unit: 'sq ft', description: 'Timeless classic design' },
  { id: 'k-back-mosaic', name: 'Mosaic Tile Backsplash', category: 'Backsplash', pricePerUnit: 28, unit: 'sq ft', description: 'Decorative patterns' },
  { id: 'k-back-glass', name: 'Glass Tile Backsplash', category: 'Backsplash', pricePerUnit: 35, unit: 'sq ft', description: 'Modern, reflective finish' },
];

const kitchenFixtures: Fixture[] = [
  { id: 'k-sink-ss', name: 'Stainless Steel Sink', category: 'Plumbing', basePrice: 450, options: [{ name: 'Double Bowl', priceAdd: 150 }, { name: 'Farmhouse Style', priceAdd: 300 }], description: 'Professional grade' },
  { id: 'k-faucet', name: 'Kitchen Faucet', category: 'Plumbing', basePrice: 275, options: [{ name: 'Pull-Down Sprayer', priceAdd: 100 }, { name: 'Touchless', priceAdd: 200 }], description: 'Chrome or brushed nickel' },
  { id: 'k-range', name: 'Gas Range', category: 'Appliances', basePrice: 1200, options: [{ name: '6 Burner', priceAdd: 800 }, { name: 'Double Oven', priceAdd: 1200 }], description: '30" standard' },
  { id: 'k-hood', name: 'Range Hood', category: 'Appliances', basePrice: 650, options: [{ name: 'Island Mount', priceAdd: 400 }, { name: 'Custom Insert', priceAdd: 600 }], description: '600 CFM' },
  { id: 'k-fridge', name: 'Refrigerator', category: 'Appliances', basePrice: 1800, options: [{ name: 'French Door', priceAdd: 800 }, { name: 'Built-In', priceAdd: 2500 }], description: 'Counter depth' },
  { id: 'k-dishwasher', name: 'Dishwasher', category: 'Appliances', basePrice: 750, options: [{ name: 'Panel Ready', priceAdd: 200 }, { name: 'Third Rack', priceAdd: 150 }], description: 'Quiet operation' },
  { id: 'k-light-pendant', name: 'Pendant Lights (set of 3)', category: 'Lighting', basePrice: 450, options: [{ name: 'Designer Series', priceAdd: 300 }], description: 'Island lighting' },
  { id: 'k-light-under', name: 'Under Cabinet Lighting', category: 'Lighting', basePrice: 350, options: [{ name: 'LED Strip', priceAdd: 100 }, { name: 'Puck Lights', priceAdd: 50 }], description: 'Task lighting' },
];

// Bathroom Materials & Fixtures
const bathroomMaterials: Material[] = [
  { id: 'b-tile-ceramic', name: 'Ceramic Wall Tile', category: 'Wall Tile', pricePerUnit: 8, unit: 'sq ft', description: 'Classic, easy to clean' },
  { id: 'b-tile-porcelain', name: 'Porcelain Wall Tile', category: 'Wall Tile', pricePerUnit: 14, unit: 'sq ft', description: 'Durable, water resistant' },
  { id: 'b-tile-marble', name: 'Marble Wall Tile', category: 'Wall Tile', pricePerUnit: 35, unit: 'sq ft', description: 'Luxury natural stone' },
  { id: 'b-floor-tile', name: 'Porcelain Floor Tile', category: 'Flooring', pricePerUnit: 12, unit: 'sq ft', description: 'Slip resistant' },
  { id: 'b-floor-heated', name: 'Heated Floor System', category: 'Flooring', pricePerUnit: 18, unit: 'sq ft', description: 'Electric radiant heat' },
  { id: 'b-vanity-single', name: 'Single Vanity Cabinet', category: 'Vanity', pricePerUnit: 850, unit: 'each', description: '36" with soft-close' },
  { id: 'b-vanity-double', name: 'Double Vanity Cabinet', category: 'Vanity', pricePerUnit: 1450, unit: 'each', description: '60" with soft-close' },
  { id: 'b-vanity-float', name: 'Floating Vanity', category: 'Vanity', pricePerUnit: 1200, unit: 'each', description: 'Modern wall-mounted' },
  { id: 'b-counter-quartz', name: 'Quartz Vanity Top', category: 'Countertop', pricePerUnit: 85, unit: 'sq ft', description: 'With undermount sink cutout' },
  { id: 'b-counter-marble', name: 'Marble Vanity Top', category: 'Countertop', pricePerUnit: 120, unit: 'sq ft', description: 'Elegant natural stone' },
];

const bathroomFixtures: Fixture[] = [
  { id: 'b-toilet', name: 'Toilet', category: 'Plumbing', basePrice: 450, options: [{ name: 'Dual Flush', priceAdd: 100 }, { name: 'Smart Bidet', priceAdd: 800 }], description: 'Elongated bowl' },
  { id: 'b-shower-std', name: 'Shower System', category: 'Plumbing', basePrice: 650, options: [{ name: 'Rain Head', priceAdd: 200 }, { name: 'Body Jets', priceAdd: 500 }], description: 'Complete kit' },
  { id: 'b-tub-std', name: 'Bathtub', category: 'Plumbing', basePrice: 800, options: [{ name: 'Freestanding', priceAdd: 1200 }, { name: 'Jetted', priceAdd: 1500 }], description: '60" alcove' },
  { id: 'b-faucet', name: 'Bathroom Faucet', category: 'Plumbing', basePrice: 225, options: [{ name: 'Widespread', priceAdd: 75 }, { name: 'Waterfall', priceAdd: 150 }], description: 'Single or double handle' },
  { id: 'b-mirror', name: 'Vanity Mirror', category: 'Accessories', basePrice: 350, options: [{ name: 'LED Backlit', priceAdd: 200 }, { name: 'Medicine Cabinet', priceAdd: 150 }], description: 'Frameless' },
  { id: 'b-light', name: 'Vanity Light Fixture', category: 'Lighting', basePrice: 275, options: [{ name: '4-Light Bar', priceAdd: 75 }, { name: 'Sconces (pair)', priceAdd: 100 }], description: 'Chrome or brushed nickel' },
  { id: 'b-exhaust', name: 'Exhaust Fan', category: 'Ventilation', basePrice: 175, options: [{ name: 'With Light', priceAdd: 75 }, { name: 'With Heater', priceAdd: 150 }], description: 'Quiet operation' },
  { id: 'b-glass', name: 'Shower Glass Enclosure', category: 'Enclosure', basePrice: 1200, options: [{ name: 'Frameless', priceAdd: 600 }, { name: 'Sliding Door', priceAdd: 300 }], description: 'Clear tempered glass' },
];

// Basement Materials & Fixtures
const basementMaterials: Material[] = [
  { id: 'bs-floor-epoxy', name: 'Epoxy Floor Coating', category: 'Flooring', pricePerUnit: 8, unit: 'sq ft', description: 'Durable, moisture resistant' },
  { id: 'bs-floor-carpet', name: 'Carpet Tiles', category: 'Flooring', pricePerUnit: 6, unit: 'sq ft', description: 'Modular, easy to replace' },
  { id: 'bs-floor-lvp', name: 'Luxury Vinyl Plank', category: 'Flooring', pricePerUnit: 7, unit: 'sq ft', description: 'Waterproof, wood look' },
  { id: 'bs-floor-engineered', name: 'Engineered Hardwood', category: 'Flooring', pricePerUnit: 14, unit: 'sq ft', description: 'Moisture resistant wood' },
  { id: 'bs-wall-drywall', name: 'Drywall Installation', category: 'Walls', pricePerUnit: 4, unit: 'sq ft', description: 'Finished and painted' },
  { id: 'bs-wall-panel', name: 'Wall Paneling System', category: 'Walls', pricePerUnit: 8, unit: 'sq ft', description: 'Moisture resistant panels' },
  { id: 'bs-ceiling-drop', name: 'Drop Ceiling', category: 'Ceiling', pricePerUnit: 5, unit: 'sq ft', description: 'Easy access to utilities' },
  { id: 'bs-ceiling-drywall', name: 'Drywall Ceiling', category: 'Ceiling', pricePerUnit: 6, unit: 'sq ft', description: 'Finished look' },
  { id: 'bs-insulation', name: 'Wall Insulation', category: 'Insulation', pricePerUnit: 3, unit: 'sq ft', description: 'R-13 fiberglass' },
  { id: 'bs-vapor', name: 'Vapor Barrier', category: 'Moisture Control', pricePerUnit: 1.5, unit: 'sq ft', description: '6 mil polyethylene' },
];

const basementFixtures: Fixture[] = [
  { id: 'bs-sump', name: 'Sump Pump System', category: 'Waterproofing', basePrice: 1200, options: [{ name: 'Battery Backup', priceAdd: 400 }, { name: 'WiFi Monitoring', priceAdd: 200 }], description: '1/2 HP submersible' },
  { id: 'bs-dehumid', name: 'Dehumidifier', category: 'Climate Control', basePrice: 450, options: [{ name: 'Whole House', priceAdd: 800 }, { name: 'Auto Drain', priceAdd: 100 }], description: '50 pint capacity' },
  { id: 'bs-egress', name: 'Egress Window', category: 'Windows', basePrice: 2500, options: [{ name: 'Window Well Cover', priceAdd: 200 }, { name: 'Larger Size', priceAdd: 500 }], description: 'Code compliant' },
  { id: 'bs-hvac', name: 'HVAC Extension', category: 'Climate Control', basePrice: 1800, options: [{ name: 'Separate Zone', priceAdd: 1200 }, { name: 'Mini Split', priceAdd: 2000 }], description: 'Ductwork extension' },
  { id: 'bs-electric', name: 'Electrical Panel Upgrade', category: 'Electrical', basePrice: 1500, options: [{ name: '200 Amp', priceAdd: 500 }, { name: 'Subpanel', priceAdd: 800 }], description: 'Code compliant' },
  { id: 'bs-lighting', name: 'Recessed Lighting (6 pack)', category: 'Lighting', basePrice: 600, options: [{ name: 'LED Dimmable', priceAdd: 150 }, { name: 'Smart Control', priceAdd: 200 }], description: '6" can lights' },
  { id: 'bs-bath', name: 'Basement Bathroom Rough-In', category: 'Plumbing', basePrice: 3500, options: [{ name: 'Ejector Pump', priceAdd: 800 }, { name: 'Full Bath', priceAdd: 2000 }], description: 'Plumbing prep' },
  { id: 'bs-bar', name: 'Wet Bar Installation', category: 'Features', basePrice: 4500, options: [{ name: 'Sink & Faucet', priceAdd: 500 }, { name: 'Mini Fridge Space', priceAdd: 300 }], description: 'Custom built' },
];

const roomTemplates = {
  kitchen: [
    { name: 'Budget Kitchen Refresh', description: 'Cabinet refacing, new countertops, updated fixtures', estimatedCost: '$15,000 - $25,000' },
    { name: 'Mid-Range Kitchen Remodel', description: 'New cabinets, quartz counters, quality appliances', estimatedCost: '$35,000 - $55,000' },
    { name: 'Luxury Kitchen Renovation', description: 'Custom cabinets, premium appliances, designer finishes', estimatedCost: '$75,000 - $150,000+' },
  ],
  bathroom: [
    { name: 'Half Bath Update', description: 'New vanity, toilet, fixtures, and paint', estimatedCost: '$5,000 - $10,000' },
    { name: 'Full Bath Remodel', description: 'Complete renovation with new tile, fixtures, vanity', estimatedCost: '$15,000 - $30,000' },
    { name: 'Master Bath Luxury', description: 'Spa-like features, heated floors, premium finishes', estimatedCost: '$40,000 - $75,000+' },
  ],
  basement: [
    { name: 'Basic Finish', description: 'Drywall, flooring, lighting, basic electrical', estimatedCost: '$25,000 - $40,000' },
    { name: 'Entertainment Space', description: 'Finished with wet bar, media area, bathroom rough-in', estimatedCost: '$50,000 - $80,000' },
    { name: 'Full Living Suite', description: 'Complete with bedroom, full bath, kitchenette', estimatedCost: '$80,000 - $150,000+' },
  ],
};

interface DesignStudioProps {
  onCreateEstimate?: (items: SelectedItem[], roomType: RoomType, dimensions: { length: number; width: number; height: number }) => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ onCreateEstimate }) => {
  const { toast } = useToast();
  const [roomType, setRoomType] = useState<RoomType>('kitchen');
  const [dimensions, setDimensions] = useState({ length: 12, width: 10, height: 9 });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<RoomDesign[]>([]);
  const [designName, setDesignName] = useState('');
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);

  // Load saved designs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('level_room_designs');
    if (saved) {
      try {
        setSavedDesigns(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved designs:', e);
      }
    }
  }, []);

  // Get materials and fixtures based on room type
  const getMaterials = (): Material[] => {
    switch (roomType) {
      case 'kitchen': return kitchenMaterials;
      case 'bathroom': return bathroomMaterials;
      case 'basement': return basementMaterials;
      default: return [];
    }
  };

  const getFixtures = (): Fixture[] => {
    switch (roomType) {
      case 'kitchen': return kitchenFixtures;
      case 'bathroom': return bathroomFixtures;
      case 'basement': return basementFixtures;
      default: return [];
    }
  };

  const getCategories = (): string[] => {
    const materials = getMaterials();
    const fixtures = getFixtures();
    const allCategories = [...new Set([...materials.map(m => m.category), ...fixtures.map(f => f.category)])];
    return ['all', ...allCategories];
  };

  // Calculate room metrics
  const floorArea = dimensions.length * dimensions.width;
  const wallArea = 2 * (dimensions.length + dimensions.width) * dimensions.height;
  const ceilingArea = floorArea;

  // Calculate total cost
  const totalCost = selectedItems.reduce((sum, item) => sum + item.total, 0);

  // Labor estimate (typically 40-60% of materials)
  const laborEstimate = totalCost * 0.5;
  const grandTotal = totalCost + laborEstimate;

  const addMaterial = (material: Material) => {
    const existingIndex = selectedItems.findIndex(item => item.itemId === material.id);
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setSelectedItems(updated);
    } else {
      // Add new item
      const newItem: SelectedItem = {
        id: `${material.id}-${Date.now()}`,
        itemId: material.id,
        name: material.name,
        category: material.category,
        quantity: 1,
        unitPrice: material.pricePerUnit,
        total: material.pricePerUnit,
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    toast({ title: 'Added', description: `${material.name} added to design` });
  };

  const addFixture = (fixture: Fixture, selectedOptions: string[] = []) => {
    const optionsPrice = selectedOptions.reduce((sum, optName) => {
      const opt = fixture.options.find(o => o.name === optName);
      return sum + (opt?.priceAdd || 0);
    }, 0);
    const totalPrice = fixture.basePrice + optionsPrice;

    const newItem: SelectedItem = {
      id: `${fixture.id}-${Date.now()}`,
      itemId: fixture.id,
      name: fixture.name,
      category: fixture.category,
      quantity: 1,
      unitPrice: totalPrice,
      total: totalPrice,
      options: selectedOptions,
    };
    setSelectedItems([...selectedItems, newItem]);
    toast({ title: 'Added', description: `${fixture.name} added to design` });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems(items => items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setSelectedItems(items => items.filter(item => item.id !== id));
  };

  const saveDesign = () => {
    if (!designName.trim()) {
      toast({ title: 'Error', description: 'Please enter a design name', variant: 'destructive' });
      return;
    }

    const newDesign: RoomDesign = {
      id: `design-${Date.now()}`,
      name: designName,
      roomType,
      dimensions,
      selectedItems,
      notes,
      createdAt: new Date().toISOString(),
      totalCost: grandTotal,
    };

    const updated = [...savedDesigns, newDesign];
    setSavedDesigns(updated);
    localStorage.setItem('level_room_designs', JSON.stringify(updated));
    toast({ title: 'Saved', description: 'Design saved successfully' });
    setDesignName('');
  };

  const loadDesign = (design: RoomDesign) => {
    setRoomType(design.roomType);
    setDimensions(design.dimensions);
    setSelectedItems(design.selectedItems);
    setNotes(design.notes);
    setDesignName(design.name);
    setShowSavedDesigns(false);
    toast({ title: 'Loaded', description: `Design "${design.name}" loaded` });
  };

  const deleteDesign = (id: string) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('level_room_designs', JSON.stringify(updated));
    toast({ title: 'Deleted', description: 'Design deleted' });
  };

  const handleCreateEstimate = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Error', description: 'Please add items to your design first', variant: 'destructive' });
      return;
    }
    if (onCreateEstimate) {
      onCreateEstimate(selectedItems, roomType, dimensions);
    }
    toast({ title: 'Success', description: 'Design ready to convert to estimate' });
  };

  const clearDesign = () => {
    setSelectedItems([]);
    setDesignName('');
    setNotes('');
    toast({ title: 'Cleared', description: 'Design cleared' });
  };

  const getRoomIcon = (type: RoomType) => {
    switch (type) {
      case 'kitchen': return <ChefHat className="w-5 h-5" />;
      case 'bathroom': return <Bath className="w-5 h-5" />;
      case 'basement': return <Home className="w-5 h-5" />;
    }
  };

  const filteredMaterials = activeCategory === 'all' 
    ? getMaterials() 
    : getMaterials().filter(m => m.category === activeCategory);

  const filteredFixtures = activeCategory === 'all'
    ? getFixtures()
    : getFixtures().filter(f => f.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Design Studio
          </h2>
          <p className="text-gray-600 mt-1">Design kitchens, bathrooms, and basements with accurate cost estimates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSavedDesigns(!showSavedDesigns)}>
            <FileText className="w-4 h-4 mr-2" />
            Saved Designs ({savedDesigns.length})
          </Button>
          {selectedItems.length > 0 && (
            <Button onClick={handleCreateEstimate} className="bg-green-600 hover:bg-green-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Create Estimate
            </Button>
          )}
        </div>
      </div>

      {/* Saved Designs Panel */}
      {showSavedDesigns && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Saved Designs</h3>
          {savedDesigns.length === 0 ? (
            <p className="text-gray-500 text-sm">No saved designs yet</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedDesigns.map(design => (
                <div key={design.id} className="bg-white p-3 rounded-lg border flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getRoomIcon(design.roomType)}
                      <span className="font-medium">{design.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {design.dimensions.length}' x {design.dimensions.width}' • ${design.totalCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(design.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => loadDesign(design)}>Load</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteDesign(design.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Room Type Selection */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Select Room Type</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['kitchen', 'bathroom', 'basement'] as RoomType[]).map(type => (
            <button
              key={type}
              onClick={() => { setRoomType(type); setSelectedItems([]); setActiveCategory('all'); }}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                roomType === type 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {getRoomIcon(type)}
              <span className="font-medium capitalize">{type}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Room Dimensions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-gray-600" />
          Room Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Length (ft)</label>
            <input
              type="number"
              value={dimensions.length}
              onChange={e => setDimensions({ ...dimensions, length: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Width (ft)</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={e => setDimensions({ ...dimensions, width: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Height (ft)</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={e => setDimensions({ ...dimensions, height: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-600">Floor Area:</span>
            <span className="font-semibold ml-2">{floorArea} sq ft</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-600">Wall Area:</span>
            <span className="font-semibold ml-2">{wallArea} sq ft</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-600">Ceiling:</span>
            <span className="font-semibold ml-2">{ceilingArea} sq ft</span>
          </div>
        </div>
      </Card>

      {/* Templates */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Project Templates
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {roomTemplates[roomType].map((template, idx) => (
            <div key={idx} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <p className="text-sm font-semibold text-green-600 mt-2">{template.estimatedCost}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Materials & Fixtures Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {getCategories().map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Materials */}
          {filteredMaterials.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Materials
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {filteredMaterials.map(material => (
                  <div key={material.id} className="p-3 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{material.name}</h4>
                        <p className="text-xs text-gray-500">{material.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{material.category}</Badge>
                          <span className="text-sm font-semibold text-green-600">
                            ${material.pricePerUnit}/{material.unit}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addMaterial(material)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Fixtures */}
          {filteredFixtures.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-blue-600" />
                Fixtures & Features
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {filteredFixtures.map(fixture => (
                  <FixtureCard key={fixture.id} fixture={fixture} onAdd={addFixture} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Design Summary */}
        <div className="space-y-4">
          <Card className="p-4 sticky top-20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Design Summary
            </h3>

            {selectedItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Add materials and fixtures to see your estimate
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.options && item.options.length > 0 && (
                          <p className="text-xs text-gray-500">+ {item.options.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-20 text-right font-medium">${item.total.toLocaleString()}</span>
                        <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Materials & Fixtures:</span>
                    <span className="font-medium">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Est. Labor (50%):</span>
                    <span>${laborEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Estimate:</span>
                    <span className="text-green-600">${grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Design name..."
                    value={designName}
                    onChange={e => setDesignName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Notes..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={saveDesign} variant="outline" className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={clearDesign} variant="outline" className="w-full text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                  <Button onClick={handleCreateEstimate} className="w-full bg-green-600 hover:bg-green-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Estimate
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// Fixture Card Component with Options
const FixtureCard: React.FC<{ fixture: Fixture; onAdd: (fixture: Fixture, options: string[]) => void }> = ({ fixture, onAdd }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (optName: string) => {
    setSelectedOptions(prev => 
      prev.includes(optName) 
        ? prev.filter(o => o !== optName)
        : [...prev, optName]
    );
  };

  const totalPrice = fixture.basePrice + selectedOptions.reduce((sum, optName) => {
    const opt = fixture.options.find(o => o.name === optName);
    return sum + (opt?.priceAdd || 0);
  }, 0);

  const handleAdd = () => {
    onAdd(fixture, selectedOptions);
    setSelectedOptions([]);
    setShowOptions(false);
  };

  return (
    <div className="p-3 border rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">{fixture.name}</h4>
          <p className="text-xs text-gray-500">{fixture.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">{fixture.category}</Badge>
            <span className="text-sm font-semibold text-green-600">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {fixture.options.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowOptions(!showOptions)}>
              <ChevronRight className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
            </Button>
          )}
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {showOptions && fixture.options.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <p className="text-xs font-medium text-gray-600">Upgrades:</p>
          {fixture.options.map(opt => (
            <label key={opt.name} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.includes(opt.name)}
                onChange={() => toggleOption(opt.name)}
                className="rounded"
              />
              <span>{opt.name}</span>
              <span className="text-green-600 text-xs">+${opt.priceAdd}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignStudio;
