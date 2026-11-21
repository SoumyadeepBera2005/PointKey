CREATE DATABASE IF NOT EXISTS prent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prent_db;

-- 1. Users Table (Tenant, Owner, Admin)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(155) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('TENANT', 'OWNER', 'ADMIN') NOT NULL DEFAULT 'TENANT',
    tenant_gender ENUM('MALE', 'FEMALE', 'FAMILY') NULL,
    tenant_occupation ENUM('STUDENT', 'WORKING_PROFESSIONAL', 'FAMILY') NULL,
    verification_status ENUM('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'NOT_SUBMITTED',
    account_status ENUM('ACTIVE', 'BLOCKED', 'DELETED') DEFAULT 'ACTIVE',
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Rapido-style: one mobile number may hold up to 2 accounts (e.g. TENANT + OWNER),
    -- but the same number cannot be used twice for the same role.
    UNIQUE KEY uq_users_phone_role (phone, role)
) ENGINE=InnoDB;

-- 2. Owner AI Face Verification Table
CREATE TABLE owner_verifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_id CHAR(36) NOT NULL,
    id_card_type VARCHAR(50) NOT NULL,
    id_card_image_url TEXT NOT NULL,
    live_selfie_url TEXT NOT NULL,
    ai_match_score DECIMAL(5,2) NULL,
    liveness_passed BOOLEAN DEFAULT FALSE,
    admin_reviewer_id CHAR(36) NULL,
    status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Properties Table (Includes all wireframe attributes & Spatial Point)
CREATE TABLE properties (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., R01, R02
    owner_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category ENUM('ROOM', 'PG', 'FLAT') NOT NULL,
    sub_type ENUM('PERSONAL_ROOM', 'SHARED_ROOM', '1BHK', '2BHK', '3BHK') NOT NULL,
    allowed_gender ENUM('MALE', 'FEMALE', 'ANY') NOT NULL,
    allowed_tenant_type ENUM('STUDENT', 'WORKING_PROFESSIONAL', 'FAMILY', 'ANY') NOT NULL,
    room_sharing_capacity INT DEFAULT 1,
    bathroom_type ENUM('PRIVATE', 'COMMON') NOT NULL,
    kitchen_available BOOLEAN DEFAULT TRUE,
    food_included BOOLEAN DEFAULT FALSE,
    rent_amount DECIMAL(10,2) NOT NULL,
    advance_amount DECIMAL(10,2) NOT NULL,
    contract_months INT DEFAULT 6,
    water_bill_included BOOLEAN DEFAULT FALSE,
    electricity_bill_included BOOLEAN DEFAULT FALSE,
    size_sqft INT NULL,
    roof_floor_type VARCHAR(100) NULL,
    room_materials JSON NULL,
    rules_and_regulations TEXT NULL,
    allow_parents_friends BOOLEAN DEFAULT TRUE,
    nearby_landmarks JSON NULL,
    locality VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    exact_address TEXT NOT NULL,
    location POINT SRID 4326 NOT NULL,
    booking_status ENUM('UNBOOKED', 'BOOKED') DEFAULT 'UNBOOKED',
    verification_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_prop_location (location),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Timestamped Property Media (Bedroom, Bathroom, Kitchen, Balcony)
CREATE TABLE property_media (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    room_tag ENUM('BEDROOM', 'BATHROOM', 'KITCHEN', 'BALCONY', 'EXTERIOR') NOT NULL,
    media_type ENUM('IMAGE', 'VIDEO') DEFAULT 'IMAGE',
    media_url TEXT NOT NULL,
    captured_date DATE NOT NULL,
    is_cover BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Payments & 100% Refundable Ledger
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    payer_id CHAR(36) NOT NULL,
    property_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('UPI', 'CARD', 'NET_BANKING', 'WALLET', 'BANK') NOT NULL,
    gateway_order_id VARCHAR(100) UNIQUE NOT NULL,
    gateway_txn_id VARCHAR(100) UNIQUE NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUND_REQUESTED', 'REFUNDED') DEFAULT 'PENDING',
    refund_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Visit Bookings & Slot Management
CREATE TABLE visit_bookings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    payment_id CHAR(36) NULL,
    visit_date DATE NOT NULL,
    time_window ENUM('MID_MORNING', 'AFTERNOON', 'EVENING') NOT NULL,
    time_slot ENUM('10:00-11:00 AM', '11:00-12:00 PM', '3:00-4:00 PM', '4:00-5:00 PM', '7:00-8:00 PM', '8:00-9:00 PM') NOT NULL,
    status ENUM('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED') DEFAULT 'REQUESTED',
    agreement_proof_url TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Slot lookup index; double-booking is prevented at the application layer
-- (transaction + existence check on active statuses) in visitController.js
CREATE INDEX idx_visit_slot ON visit_bookings (property_id, visit_date, time_slot);

-- 7. Two-Way Ratings (Tenant <-> Property & Owner <-> Tenant)
CREATE TABLE ratings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reviewer_id CHAR(36) NOT NULL,
    target_user_id CHAR(36) NULL,
    target_property_id CHAR(36) NULL,
    score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    review_text TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Scam Reports & Help Tickets
CREATE TABLE reports_and_tickets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reporter_id CHAR(36) NOT NULL,
    target_user_id CHAR(36) NULL,
    target_property_id CHAR(36) NULL,
    type ENUM('SCAM', 'REPORT', 'HELP_REQUEST', 'REFUND_DISPUTE') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'BLOCKED') DEFAULT 'OPEN',
    admin_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Chat Messages (persisted Socket.io tenant <-> owner conversations)
CREATE TABLE chat_messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    receiver_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    read_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Admin Audit Log (verified-listing deletion etc.)
CREATE TABLE admin_audit_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id CHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    details JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
