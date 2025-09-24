import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Package, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface StoreItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  image: string;
  rating: number;
}

const ManageStore = () => {
  const [items, setItems] = useState<StoreItem[]>([
    {
      id: "1",
      name: "School Uniform - Blue Shirt",
      price: 2500,
      category: "uniforms",
      stock: 50,
      description: "High-quality blue shirt for students",
      image: "/api/placeholder/200/200",
      rating: 4.5
    },
    {
      id: "2", 
      name: "Mathematics Textbook",
      price: 3200,
      category: "textbooks",
      stock: 30,
      description: "Comprehensive mathematics textbook for secondary schools",
      image: "/api/placeholder/200/200",
      rating: 4.8
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    category: "",
    stock: 0,
    description: "",
    image: ""
  });

  const categories = [
    { value: "uniforms", label: "School Uniforms" },
    { value: "textbooks", label: "Textbooks" }, 
    { value: "notebooks", label: "Notebooks" },
    { value: "sportswear", label: "Sports Wear" },
    { value: "fridaywear", label: "Friday Wear" },
    { value: "accessories", label: "Accessories" }
  ];

  const handleAddItem = () => {
    const item: StoreItem = {
      id: Date.now().toString(),
      ...newItem,
      rating: 0
    };
    setItems([...items, item]);
    setNewItem({ name: "", price: 0, category: "", stock: 0, description: "", image: "" });
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
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
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemPrice">Price (₦)</Label>
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
                    <Label>Category</Label>
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
                    <Label htmlFor="itemStock">Stock Quantity</Label>
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
                  <Label htmlFor="itemImage">Image URL</Label>
                  <Input
                    id="itemImage"
                    value={newItem.image}
                    onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                    placeholder="Enter image URL"
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddItem}>Add Item</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
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
                        <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground" />
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
                            <Button size="sm" variant="outline" className="flex-1">
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
    </div>
  );
};

export default ManageStore;