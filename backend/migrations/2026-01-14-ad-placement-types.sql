-- Add new placement types to ad_banners table
-- Simplified placements: BANNER_SLIDER, SIDEBAR_LEFT, SIDEBAR_RIGHT, HERO_SECTION only

ALTER TABLE ad_banners MODIFY COLUMN placement ENUM('BANNER_SLIDER', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'HERO_SECTION') DEFAULT 'SIDEBAR_RIGHT';

-- Optional: Update any existing data to use new placement names
-- UPDATE ad_banners SET placement = 'BANNER_SLIDER' WHERE placement = 'HOME_SLIDER';
-- UPDATE ad_banners SET placement = 'SIDEBAR_RIGHT' WHERE placement = 'SIDEBAR';
