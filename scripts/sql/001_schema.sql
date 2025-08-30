-- venues (minimal)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  description TEXT,
  rating DECIMAL(3,2),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2)
);

-- venue images
CREATE TABLE IF NOT EXISTS venue_images (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- halls (required)
CREATE TABLE IF NOT EXISTS halls (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255),
  capacity_min INTEGER,
  capacity_max INTEGER,
  price_per_hour DECIMAL(10, 2),
  amenities TEXT[]
);

-- bookings (required)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  event_date DATE,
  start_time TIME,
  end_time TIME,
  guest_count INTEGER,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Basic index to speed overlap queries
CREATE INDEX IF NOT EXISTS idx_bookings_hall_date ON bookings (hall_id, event_date);
