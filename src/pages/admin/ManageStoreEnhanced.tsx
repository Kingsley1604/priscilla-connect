import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Package, Star, Upload, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface StoreItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  image_url: string | null;
  image_file: string | null;
  rating: number;
  is_active: boolean;
}

const ManageStoreEnhanced = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    category: "",
    stock: 0,
    description: "",
    image_url: ""
  });

  const categories = [
    { value: "uniforms", label: "School Uniforms" },
    { value: "textbooks", label: "Textbooks" }, 
    { value: "notebooks", label: "Notebooks" },
    { value: "sportswear", label: "Sports Wear" },
    { value: "fridaywear", label: "Friday Wear" },
    { value: "accessories", label: "Accessories" }
  ];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load store items');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImagePreview(preview);
        if (editingItem) {
          setEditingItem({ ...editingItem, image_url: preview });
        } else {
          setNewItem({ ...newItem, image_url: preview });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('store_items')
        .insert({
          name: newItem.name,
          price: newItem.price,
          category: newItem.category,
          stock: newItem.stock,
          description: newItem.description,
          image_url: imagePreview || null,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Item added successfully!');
      setNewItem({ name: "", price: 0, category: "", stock: 0, description: "", image_url: "" });
      setImagePreview("");
      setImageFile(null);
      setShowAddForm(false);
      loadItems();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('store_items')
        .update({
          name: editingItem.name,
          price: editingItem.price,
          category: editingItem.category,
          stock: editingItem.stock,
          description: editingItem.description,
          image_url: editingItem.image_url
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Item updated successfully!');
      setEditingItem(null);
      setImagePreview("");
      setImageFile(null);
      loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item deleted successfully!');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manage Store</h1>
                <p className="text-white/90">Add and manage school store items</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {showAddForm && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Add New Store Item</CardTitle>
                <CardDescription>Add a new item to the school store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemPrice">Price (₦) *</Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="itemStock">Stock Quantity *</Label>
                    <Input
                      id="itemStock"
                      type="number"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({...newItem, stock: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="itemDescription">Description</Label>
                  <Textarea
                    id="itemDescription"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Enter item description"
                  />
                </div>

                <div>
                  <Label htmlFor="itemImage">Upload Item Image</Label>
                  <div className="mt-2 space-y-4">
                    <Input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {imagePreview && (
                      <div className="relative w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddForm(false);
                    setImagePreview("");
                    setImageFile(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Store Items ({items.length})</CardTitle>
              <CardDescription>Manage all store inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No items in store yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <Card key={item.id} className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-16 w-16 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">₦{item.price.toLocaleString()}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{item.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={item.stock > 10 ? "default" : item.stock > 0 ? "secondary" : "destructive"}>
                              Stock: {item.stock}
                            </Badge>
                            <Badge variant="outline">
                              {categories.find(c => c.value === item.category)?.label}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Store Item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={editingItem.category} onValueChange={(value) => setEditingItem({...editingItem, category: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({...editingItem, stock: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Upload New Image (Optional)</Label>
                <div className="mt-2 space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {(editingItem.image_url || imagePreview) && (
                    <div className="relative w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img src={imagePreview || editingItem.image_url || ""} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingItem(null);
              setImagePreview("");
              setImageFile(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageStoreEnhanced;
