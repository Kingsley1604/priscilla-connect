import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, AlertTriangle, Bell, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface StoreItem {
  id: string;
  name: string;
  stock: number;
  category: string;
  price: number;
}

interface InventoryAlert {
  id: string;
  store_item_id: string;
  item_name: string;
  alert_threshold: number;
  current_stock: number;
  is_active: boolean;
}

const InventoryManager = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  useEffect(() => {
    loadItems();
    loadAlerts();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('stock', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load inventory items');
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load inventory alerts');
    }
  };

  const getAlertThresholdForItem = (itemId: string) => {
    const alert = alerts.find(a => a.store_item_id === itemId);
    return alert?.alert_threshold || 10;
  };

  const isLowStock = (item: StoreItem) => {
    const threshold = getAlertThresholdForItem(item.id);
    return item.stock <= threshold;
  };

  const handleSetAlert = async () => {
    if (!selectedItem || !user) return;

    try {
      // Check if alert already exists
      const existingAlert = alerts.find(a => a.store_item_id === selectedItem.id);

      if (existingAlert) {
        // Update existing alert
        const { error } = await supabase
          .from('inventory_alerts')
          .update({
            alert_threshold: alertThreshold,
            current_stock: selectedItem.stock
          })
          .eq('id', existingAlert.id);

        if (error) throw error;
        toast.success('Alert threshold updated successfully!');
      } else {
        // Create new alert
        const { error } = await supabase
          .from('inventory_alerts')
          .insert({
            store_item_id: selectedItem.id,
            item_name: selectedItem.name,
            alert_threshold: alertThreshold,
            current_stock: selectedItem.stock,
            created_by: user.id
          });

        if (error) throw error;
        toast.success('Alert created successfully!');
      }

      // Check if notification should be created
      if (selectedItem.stock <= alertThreshold) {
        await supabase
          .from('admin_notifications')
          .insert({
            title: `Low Stock Alert: ${selectedItem.name}`,
            message: `Stock level is ${selectedItem.stock} (threshold: ${alertThreshold})`,
            type: 'inventory'
          });
      }

      setIsAlertDialogOpen(false);
      loadAlerts();
    } catch (error) {
      console.error('Error setting alert:', error);
      toast.error('Failed to set alert');
    }
  };

  const lowStockItems = items.filter(isLowStock);
  const normalStockItems = items.filter(item => !isLowStock(item));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
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
                <h1 className="text-3xl font-bold">Inventory Manager</h1>
                <p className="text-white/90">Monitor and manage store inventory levels</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{items.length}</div>
                <p className="text-sm text-muted-foreground">Active inventory items</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems.length}</div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Items need restocking</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-green-700 dark:text-green-400">
                  <Bell className="h-5 w-5 mr-2" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{alerts.length}</div>
                <p className="text-sm text-green-600 dark:text-green-400">Configured alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="shadow-soft border-2 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>
                  The following items are running low and need restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.map((item) => {
                    const threshold = getAlertThresholdForItem(item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-900 dark:text-orange-100">{item.name}</h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Current Stock: <span className="font-bold">{item.stock}</span> | 
                            Threshold: <span className="font-bold">{threshold}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {item.stock <= threshold / 2 ? 'CRITICAL' : 'LOW'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setAlertThreshold(threshold);
                              setIsAlertDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Normal Stock Items */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Click on any item to configure alert thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const threshold = getAlertThresholdForItem(item.id);
                  const isLow = item.stock <= threshold;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        isLow ? 'border-orange-500 border-2' : ''
                      }`}
                      onClick={() => {
                        setSelectedItem(item);
                        setAlertThreshold(threshold);
                        setIsAlertDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold truncate flex-1">{item.name}</h3>
                            {isLow && <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 ml-2" />}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stock:</span>
                            <Badge variant={isLow ? "destructive" : "default"}>
                              {item.stock} units
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Alert at:</span>
                            <span className="font-medium">{threshold} units</span>
                          </div>
                          <Badge variant="outline" className="w-full justify-center">
                            {item.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alert Configuration Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Stock Alert</DialogTitle>
            <DialogDescription>
              Set the threshold for low stock alerts for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <div className="text-2xl font-bold">{selectedItem?.stock} units</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Alert Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 10)}
              />
              <p className="text-sm text-muted-foreground">
                You'll receive an alert when stock reaches or goes below this number
              </p>
            </div>
            {selectedItem && selectedItem.stock <= alertThreshold && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                  ⚠️ Current stock is at or below this threshold. An alert will be sent to admin notifications.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetAlert}>
              <Bell className="h-4 w-4 mr-2" />
              Set Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;
