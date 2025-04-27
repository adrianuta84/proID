-- Enable UUID generation if you prefer UUIDs over SERIAL IDs
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Using email for login)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    -- user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Alternative: UUID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phone Numbers Table
CREATE TABLE phone_numbers (
    phone_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    label VARCHAR(100), -- e.g., 'Mobile', 'Work', 'Home'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Add constraint if needed: UNIQUE(user_id, phone_number)
);

-- Email Addresses Table (For additional emails, not the primary login one)
CREATE TABLE email_addresses (
    email_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    label VARCHAR(100), -- e.g., 'Personal', 'Work'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, email_address) -- User shouldn't add the same email twice
);

-- Physical Addresses Table
CREATE TABLE physical_addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    street_address TEXT NOT NULL,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    label VARCHAR(100), -- e.g., 'Home', 'Work', 'Billing'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Identification Numbers Table (Sensitive Data!)
CREATE TABLE identification_numbers (
    id_number_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    id_type VARCHAR(100) NOT NULL, -- e.g., 'Passport', 'National ID', 'SSN'
    id_value_encrypted BYTEA NOT NULL, -- Store encrypted value as binary data
    label VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage Locations Table (Where data might be used)
CREATE TABLE usage_locations (
    usage_location_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL, -- e.g., 'amazon.com', 'Bank XYZ'
    location_url TEXT,
    category VARCHAR(100), -- e.g., 'Shopping', 'Finance', 'Government'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, location_name) -- User probably defines each location once
);

-- Attribute Usage Link Table (Junction Table)
CREATE TYPE attribute_type_enum AS ENUM ('phone', 'email', 'address', 'identification');

CREATE TABLE attribute_usage_links (
    link_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    attribute_type attribute_type_enum NOT NULL, -- Type of attribute being linked
    attribute_id INTEGER NOT NULL, -- ID from phone_numbers, email_addresses, etc.
    usage_location_id INTEGER NOT NULL REFERENCES usage_locations(usage_location_id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint to ensure the combination is unique for a user
    UNIQUE(user_id, attribute_type, attribute_id, usage_location_id)
);

-- Optional: Indexes for faster lookups on foreign keys or frequently queried columns
CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_email_addresses_user_id ON email_addresses(user_id);
CREATE INDEX idx_physical_addresses_user_id ON physical_addresses(user_id);
CREATE INDEX idx_identification_numbers_user_id ON identification_numbers(user_id);
CREATE INDEX idx_usage_locations_user_id ON usage_locations(user_id);
CREATE INDEX idx_attribute_usage_links_user_id ON attribute_usage_links(user_id);
CREATE INDEX idx_attribute_usage_links_attribute ON attribute_usage_links(attribute_type, attribute_id);
CREATE INDEX idx_attribute_usage_links_location ON attribute_usage_links(usage_location_id);

-- Optional: Trigger function to automatically update `updated_at` columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables (example for users, repeat for others)
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Repeat CREATE TRIGGER commands for:
-- phone_numbers, email_addresses, physical_addresses,
-- identification_numbers, usage_locations
-- (attribute_usage_links might not need updated_at)