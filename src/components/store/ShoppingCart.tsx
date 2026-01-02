import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart as CartIcon, Plus, Minus, X, CreditCard, Truck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { storeOrderSchema } from "@/lib/validation";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const ShoppingCart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }: ShoppingCartProps) => {
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'delivery'>('online');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryOption === 'delivery' ? 2000 : 0;
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (id: string, change: number) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + change);
      if (newQuantity === 0) {
        onRemoveItem(id);
      } else {
        onUpdateQuantity(id, newQuantity);
      }
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please log in to place an order");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate order data
    try {
      const orderDataToValidate = {
        items: cartItems,
        total_amount: total,
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress.trim() : null,
        phone_number: phoneNumber.trim(),
        notes: notes.trim() || null,
      };

      storeOrderSchema.parse(orderDataToValidate);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || "Invalid order data");
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderData = {
        user_id: user.id,
        items: JSON.stringify(cartItems),
        total_amount: total,
        status: 'pending',
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress.trim() : null,
        phone_number: phoneNumber.trim(),
        notes: notes.trim() || null
      };

      const { data: orderResult, error } = await supabase
        .from('store_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Create notification for admins
      if (orderResult) {
        await supabase.from('admin_notifications').insert({
          title: 'New Store Order',
          message: `New order placed for ₦${total.toLocaleString()}. ${cartItems.length} item(s) ordered.`,
          type: 'order',
          related_order_id: orderResult.id
        });
      }

      toast.success("Order placed successfully! Admin will be notified.");
      
      // Clear cart
      cartItems.forEach(item => onRemoveItem(item.id));
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error placing order:', error);
      }
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CartIcon className="h-5 w-5" />
          Shopping Cart ({cartItems.length} items)
        </DialogTitle>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <CartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <CartIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">₦{item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Delivery Options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Options</h3>
              <RadioGroup value={deliveryOption} onValueChange={(value: 'pickup' | 'delivery') => setDeliveryOption(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Pick up at school (Free)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Home delivery (+₦2,000)
                  </Label>
                </div>
              </RadioGroup>

              {deliveryOption === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Payment Options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={(value: 'online' | 'delivery') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay Online
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="pay-on-delivery" />
                  <Label htmlFor="pay-on-delivery" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Pay on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or preferences"
                />
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <Button 
              onClick={handleCheckout} 
              disabled={isCheckingOut}
              className="w-full"
              size="lg"
            >
              {isCheckingOut ? "Placing Order..." : `Place Order - ₦${total.toLocaleString()}`}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              * Parents can complete payment process for safe transactions
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingCart;