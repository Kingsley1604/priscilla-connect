-- Create store items table
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store orders table
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_address TEXT,
  phone_number TEXT,
  notes TEXT
);

-- Create video content table for PriscillaTube
CREATE TABLE public.video_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  duration TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  uploaded_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_items
CREATE POLICY "Anyone can view active store items" 
ON public.store_items 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all store items" 
ON public.store_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'role' = 'admin'
));

-- RLS Policies for store_orders
CREATE POLICY "Users can view their own orders" 
ON public.store_orders 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" 
ON public.store_orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" 
ON public.store_orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'role' = 'admin'
));

-- RLS Policies for video_content  
CREATE POLICY "Anyone can view approved videos" 
ON public.video_content 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Teachers can manage their own videos" 
ON public.video_content 
FOR ALL 
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all videos" 
ON public.video_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'role' = 'admin'
));

-- Add triggers for updated_at
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();