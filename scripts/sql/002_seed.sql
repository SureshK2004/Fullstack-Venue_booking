INSERT INTO venues (id, name, address, city, description, rating, price_min, price_max)
VALUES
  ('00000000-0000-0000-0000-000000000001','Sample Venue','123 Sample St','Metropolis','A modern venue perfect for events',4.6,120,480)
ON CONFLICT (id) DO NOTHING;

INSERT INTO venue_images (id, venue_id, url, sort_order) VALUES
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','/placeholder.svg?height=600&width=900',0),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','/placeholder.svg?height=600&width=900',1),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','/placeholder.svg?height=600&width=900',2)
ON CONFLICT DO NOTHING;

INSERT INTO halls (id, venue_id, name, capacity_min, capacity_max, price_per_hour, amenities)
VALUES
  ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','Grand Ballroom',50,400,250,ARRAY['Stage','Lighting','Sound']),
  ('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Conference Hall',20,120,110,ARRAY['Projector','WiFi','Podium'])
ON CONFLICT (id) DO NOTHING;
