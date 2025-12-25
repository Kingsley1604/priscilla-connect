import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, ShoppingCart as CartIcon, Star, Filter, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ShoppingCartComponent from "@/components/store/ShoppingCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  stock: number;
  description: string;
}

const Store = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{id: string, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url || '/placeholder.svg',
        category: item.category,
        rating: item.rating || 4.5,
        stock: item.stock,
        description: item.description || ''
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "all", name: "All Items", icon: Package },
    { id: "uniform", name: "School Uniform", icon: Package },
    { id: "textbooks", name: "Textbooks", icon: Package },
    { id: "notebooks", name: "Notebooks", icon: Package },
    { id: "sportwear", name: "Sports Wear", icon: Package },
    { id: "fridaywear", name: "Friday Wear", icon: Package }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItems = () => {
    return cart.map(cartItem => {
      const product = products.find(p => p.id === cartItem.id);
      return product ? {
        ...product,
        quantity: cartItem.quantity
      } : null;
    }).filter(Boolean) as Array<Product & {quantity: number}>;
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 pb-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-6 w-6" />
                Priscilla Store
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                School supplies delivered to your doorstep
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <CartIcon className="h-4 w-4 mr-2" />
              Cart
              {getCartItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {getCartItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                <category.icon className="h-4 w-4 mr-1" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Store Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Parent-Friendly Shopping
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  Students can browse and add items to cart. Parents can complete purchases at home for safe delivery to school or home address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                {product.image && product.image !== '/placeholder.svg' ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-slate-400" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                    {product.stock > 10 ? "In Stock" : "Low Stock"}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating) 
                          ? "text-yellow-400 fill-current" 
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({product.rating})
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>
                  <Button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                    size="sm"
                  >
                    <CartIcon className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}

      {/* Shopping Cart */}
      <ShoppingCartComponent
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={getCartItems()}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />
      </div>
    </div>
  );
};

export default Store;