USE prent_db;

-- Demo accounts (passwords: Admin@123 / Owner@123 / Tenant@123)
INSERT IGNORE INTO users (id, full_name, email, phone, whatsapp_number, password_hash, role, tenant_gender, tenant_occupation, verification_status, account_status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'pRent Admin', 'admin@prent.in', '9000000001', NULL, '$2b$10$o/I9GwLjWtZn1bejHzWZL.I/VPMXd1C05DGbD2t2o2YJZYcfZ4RKO', 'ADMIN', NULL, NULL, 'VERIFIED', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222222', 'Rahul Sharma', 'owner@prent.in', '9000000002', '9000000002', '$2b$10$5ED/MPAc.INCMeh0Kj.T.uK4GImDsMYiTTEJMup6h.awwwbx/xm8a', 'OWNER', NULL, NULL, 'VERIFIED', 'ACTIVE'),
  ('33333333-3333-3333-3333-333333333333', 'Ananya Iyer', 'tenant@prent.in', '9000000003', '9000000003', '$2b$10$tU/ccFYNsE4f1/hBgkkoAuravLjqETxaF49SYYewpEJmuJ6bKZPpy', 'TENANT', 'FEMALE', 'WORKING_PROFESSIONAL', 'VERIFIED', 'ACTIVE');

-- Demo listings (Salt Lake, Kolkata)
INSERT IGNORE INTO properties (id, property_code, owner_id, title, category, sub_type, allowed_gender, allowed_tenant_type, room_sharing_capacity, bathroom_type, kitchen_available, food_included, rent_amount, advance_amount, contract_months, water_bill_included, electricity_bill_included, size_sqft, roof_floor_type, room_materials, rules_and_regulations, allow_parents_friends, nearby_landmarks, locality, city, exact_address, location, booking_status, verification_status, average_rating)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'R01', '22222222-2222-2222-2222-222222222222', 'Cozy Single Room in Salt Lake', 'ROOM', 'PERSONAL_ROOM', 'FEMALE', 'WORKING_PROFESSIONAL', 1, 'PRIVATE', TRUE, FALSE, 6500.00, 13000.00, 6, TRUE, FALSE, 120, 'RCC / 3rd Floor', '["Bed","Table","Chair","Light","Fan"]', 'No smoking. Guests only till 9 PM.', TRUE, '{"market":"150m","atm":"100m","station":"1.1km","transport":["Bus","Auto","Toto"]}', 'Salt Lake Sector V', 'Kolkata', 'BD-12, Salt Lake Sector V, Kolkata 700091', ST_GeomFromText('POINT(88.4335 22.5735)', 4326, 'axis-order=long-lat'), 'UNBOOKED', 'VERIFIED', 4.50),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PG01', '22222222-2222-2222-2222-222222222222', 'PG with Food — Female Only, Salt Lake', 'PG', 'SHARED_ROOM', 'FEMALE', 'STUDENT', 2, 'COMMON', TRUE, TRUE, 8500.00, 8500.00, 6, TRUE, TRUE, 100, 'RCC / 2nd Floor', '["Bed","Table","Chair","Light","Fan","Gas"]', 'Curfew 10:30 PM. No male visitors.', FALSE, '{"market":"300m","atm":"250m","station":"800m","transport":["Bus","Toto"]}', 'Salt Lake Sector III', 'Kolkata', 'CE-44, Salt Lake Sector III, Kolkata 700091', ST_GeomFromText('POINT(88.4210 22.5780)', 4326, 'axis-order=long-lat'), 'UNBOOKED', 'VERIFIED', 4.20),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'F01', '22222222-2222-2222-2222-222222222222', 'Furnished 2 BHK Flat for Family', 'FLAT', '2BHK', 'ANY', 'FAMILY', 1, 'PRIVATE', TRUE, FALSE, 22000.00, 44000.00, 11, FALSE, FALSE, 750, 'RCC / 5th Floor', '["Bed","Table","Chair","Light","Fan","Gas","Oven"]', 'Society rules apply. Pets allowed.', TRUE, '{"market":"400m","atm":"150m","station":"1.5km","transport":["Bus","Auto","Rickshaw"]}', 'Salt Lake Sector II', 'Kolkata', 'AE-96, Salt Lake Sector II, Kolkata 700091', ST_GeomFromText('POINT(88.4150 22.5820)', 4326, 'axis-order=long-lat'), 'UNBOOKED', 'VERIFIED', 4.80);

INSERT IGNORE INTO property_media (property_id, room_tag, media_type, media_url, captured_date, is_cover)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BEDROOM', 'IMAGE', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', '2026-10-01', TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BATHROOM', 'IMAGE', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', '2026-10-01', FALSE),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BEDROOM', 'IMAGE', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', '2026-10-05', TRUE),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'BEDROOM', 'IMAGE', 'https://images.unsplash.com/photo-1502672260263-a1ef2d93679e?w=800', '2026-10-08', TRUE);
