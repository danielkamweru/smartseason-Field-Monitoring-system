-- SmartSeason Field Monitoring System Database Schema
-- PostgreSQL Database Initialization

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(50) NOT NULL,
    planting_date DATE NOT NULL,
    current_stage VARCHAR(20) NOT NULL CHECK (current_stage IN ('planted', 'growing', 'ready', 'harvested')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'at_risk', 'completed')),
    assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create field_updates table
CREATE TABLE IF NOT EXISTS field_updates (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('planted', 'growing', 'ready', 'harvested')),
    notes TEXT,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_fields_agent_id ON fields(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_fields_status ON fields(status);
CREATE INDEX IF NOT EXISTS idx_fields_stage ON fields(current_stage);
CREATE INDEX IF NOT EXISTS idx_field_updates_field_id ON field_updates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_updates_agent_id ON field_updates(agent_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
-- Insert admin user (password: password)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@smartseason.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert field agent users (password: password)
INSERT INTO users (username, email, password_hash, role) VALUES 
('agent1', 'agent1@smartseason.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent'),
('agent2', 'agent2@smartseason.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent')
ON CONFLICT (email) DO NOTHING;

-- Insert sample fields
INSERT INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES 
('North Field', 'Maize', CURRENT_DATE - INTERVAL '45 days', 'growing', 'active', 2),
('South Field', 'Wheat', CURRENT_DATE - INTERVAL '20 days', 'planted', 'active', 2),
('East Field', 'Tomatoes', CURRENT_DATE - INTERVAL '90 days', 'ready', 'active', 3),
('West Field', 'Potatoes', CURRENT_DATE - INTERVAL '150 days', 'harvested', 'completed', 3),
('Central Field', 'Beans', CURRENT_DATE - INTERVAL '35 days', 'growing', 'at_risk', 2)
ON CONFLICT DO NOTHING;

-- Insert sample field updates
INSERT INTO field_updates (field_id, agent_id, stage, notes, update_date) VALUES 
(1, 2, 'planted', 'Initial planting completed successfully', CURRENT_DATE - INTERVAL '45 days'),
(1, 2, 'growing', 'Crops showing healthy growth, good germination rate', CURRENT_DATE - INTERVAL '30 days'),
(2, 2, 'planted', 'Wheat seeds planted with proper spacing', CURRENT_DATE - INTERVAL '20 days'),
(3, 3, 'planted', 'Tomato seedlings transplanted', CURRENT_DATE - INTERVAL '90 days'),
(3, 3, 'growing', 'Plants developing well, need support stakes', CURRENT_DATE - INTERVAL '60 days'),
(3, 3, 'ready', 'Tomatoes ripe and ready for harvest', CURRENT_DATE - INTERVAL '10 days'),
(4, 3, 'planted', 'Potato tubers planted in rows', CURRENT_DATE - INTERVAL '150 days'),
(4, 3, 'growing', 'Healthy foliage development', CURRENT_DATE - INTERVAL '120 days'),
(4, 3, 'ready', 'Plants matured, ready for harvesting', CURRENT_DATE - INTERVAL '100 days'),
(4, 3, 'harvested', 'Harvest completed, good yield obtained', CURRENT_DATE - INTERVAL '80 days'),
(5, 2, 'planted', 'Beans planted after soil preparation', CURRENT_DATE - INTERVAL '35 days'),
(5, 2, 'growing', 'Slow growth observed, may need fertilizer', CURRENT_DATE - INTERVAL '15 days')
ON CONFLICT DO NOTHING;
